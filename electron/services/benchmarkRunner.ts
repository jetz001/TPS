import { BrowserWindow } from 'electron'
import { BUILT_IN_TEST_CASES, CONTEXT_LENGTH_PROMPTS } from '../suites/builtInSuites'
import { streamChatCompletion } from './llmClient'
import { validateToolCalls } from './toolValidator'
import { executeMockTool } from './mockExecutor'
import { saveBenchmarkRun } from './storage'
import { BenchmarkRun, TestCategory, TestCase, TestResult, ContextCurvePoint } from '../../src/types'

let isCancelled = false

export function cancelCurrentBenchmark() {
  isCancelled = true
}

export async function executeBenchmarkSuite(
  window: BrowserWindow | null,
  options: {
    endpoint: string
    apiKey?: string
    model: string
    categories?: TestCategory[]
  }
): Promise<BenchmarkRun> {
  isCancelled = false
  const selectedCategories = options.categories || [
    'tps_speed',
    'single_tool',
    'multi_tool_routing',
    'parallel_tool',
    'schema_strictness',
    'tool_restraint'
  ]

  const testsToRun = BUILT_IN_TEST_CASES.filter(t => selectedCategories.includes(t.category))
  const results: TestResult[] = []

  for (let i = 0; i < testsToRun.length; i++) {
    if (isCancelled) break

    const testCase = testsToRun[i]
    window?.webContents.send('benchmark:progress', {
      currentIndex: i,
      total: testsToRun.length,
      currentTestName: testCase.name,
      category: testCase.category
    })

    try {
      const messages = [
        ...(testCase.systemPrompt ? [{ role: 'system', content: testCase.systemPrompt }] : []),
        { role: 'user', content: testCase.prompt }
      ]

      const completion = await streamChatCompletion({
        endpoint: options.endpoint,
        apiKey: options.apiKey,
        model: options.model,
        messages,
        tools: testCase.tools,
        max_tokens: testCase.maxTokens || 1024,
        onChunk: (delta, tokenCount, currentTps) => {
          window?.webContents.send('benchmark:chunk', {
            testId: testCase.id,
            delta,
            tokenCount,
            currentTps
          })
        }
      })

      // Validation
      let evalErrors: string[] = []
      let passed = true
      let parsedCalls: Array<{ name: string; arguments: Record<string, any> }> = []
      let toolExecutionResults: Array<{ toolName: string; output: any }> = []
      let outputAfterTools: string | undefined = undefined
      let secondTurnTps: number | undefined = undefined

      if (testCase.category === 'tps_speed') {
        // Speed tests pass if they generated >= 20 tokens without error
        passed = completion.completionTokens >= 20
        if (!passed) {
          evalErrors.push(`Generated too few tokens: ${completion.completionTokens}`)
        }
      } else {
        const validation = validateToolCalls(testCase, completion.fullText, completion.toolCalls)
        passed = validation.passed
        evalErrors = validation.errors
        parsedCalls = validation.parsedCalls

        // If tool calls were made, execute mock tools and request Turn 2 (Output After Tools)
        if (parsedCalls.length > 0 && !isCancelled) {
          try {
            for (const call of parsedCalls) {
              const execRes = await executeMockTool(call.name, call.arguments)
              toolExecutionResults.push({
                toolName: call.name,
                output: execRes.result
              })
            }

            // Send tool outputs back to model for synthesis
            const toolCallMessages: any[] = completion.toolCalls.map((tc, idx) => ({
              role: 'tool',
              tool_call_id: tc.id || `call_${idx}`,
              name: tc.function.name,
              content: JSON.stringify(toolExecutionResults[idx]?.output || {})
            }))

            const turn2Messages = [
              ...messages,
              {
                role: 'assistant',
                content: completion.fullText || '',
                tool_calls: completion.toolCalls
              },
              ...toolCallMessages
            ]

            const turn2Completion = await streamChatCompletion({
              endpoint: options.endpoint,
              apiKey: options.apiKey,
              model: options.model,
              messages: turn2Messages,
              max_tokens: 500,
              onChunk: (delta, tokenCount, currentTps) => {
                window?.webContents.send('benchmark:chunk', {
                  testId: testCase.id,
                  delta,
                  tokenCount,
                  currentTps
                })
              }
            })

            outputAfterTools = turn2Completion.fullText
            secondTurnTps = turn2Completion.generationTps
          } catch (turn2Err: any) {
            console.warn(`Turn 2 (output after tools) error for ${testCase.id}:`, turn2Err)
          }
        }
      }

      const resultItem: TestResult = {
        testId: testCase.id,
        category: testCase.category,
        name: testCase.name,
        passed,
        ttftMs: completion.ttftMs,
        generationTps: completion.generationTps,
        totalDurationMs: completion.totalDurationMs,
        promptTokens: completion.promptTokens,
        completionTokens: completion.completionTokens,
        rawPrompt: testCase.prompt,
        rawResponse: completion.fullText,
        toolCallsMade: parsedCalls.length > 0 ? parsedCalls : completion.toolCalls.map(c => {
          try {
            return { name: c.function.name, arguments: JSON.parse(c.function.arguments) }
          } catch {
            return { name: c.function.name, arguments: { _raw: c.function.arguments } }
          }
        }),
        evalErrors,
        chunkTimings: completion.chunkTimings,
        toolExecutionResults: toolExecutionResults.length > 0 ? toolExecutionResults : undefined,
        outputAfterTools,
        secondTurnTps
      }

      results.push(resultItem)
      window?.webContents.send('benchmark:test_completed', resultItem)
    } catch (err: any) {
      const errorResult: TestResult = {
        testId: testCase.id,
        category: testCase.category,
        name: testCase.name,
        passed: false,
        ttftMs: 0,
        generationTps: 0,
        totalDurationMs: 0,
        promptTokens: 0,
        completionTokens: 0,
        rawPrompt: testCase.prompt,
        rawResponse: '',
        toolCallsMade: [],
        evalErrors: [err.message || 'Execution error']
      }
      results.push(errorResult)
      window?.webContents.send('benchmark:test_completed', errorResult)
    }
  }

  // Calculate summary metrics
  const totalTests = results.length
  const passedTests = results.filter(r => r.passed).length
  const scorePercent = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
  
  const validTpsRuns = results.filter(r => r.generationTps > 0)
  const avgTps = validTpsRuns.length > 0
    ? Number((validTpsRuns.reduce((sum, r) => sum + r.generationTps, 0) / validTpsRuns.length).toFixed(2))
    : 0

  const validTtftRuns = results.filter(r => r.ttftMs > 0)
  const avgTtftMs = validTtftRuns.length > 0
    ? Math.round(validTtftRuns.reduce((sum, r) => sum + r.ttftMs, 0) / validTtftRuns.length)
    : 0

  // Category breakdown
  const categoryScores: Record<string, { total: number; passed: number; percent: number }> = {}
  for (const r of results) {
    if (!categoryScores[r.category]) {
      categoryScores[r.category] = { total: 0, passed: 0, percent: 0 }
    }
    categoryScores[r.category].total++
    if (r.passed) categoryScores[r.category].passed++
  }
  for (const cat in categoryScores) {
    const s = categoryScores[cat]
    s.percent = Math.round((s.passed / s.total) * 100)
  }

  const runData: BenchmarkRun = {
    id: `run_${Date.now()}`,
    timestamp: new Date().toISOString(),
    endpoint: options.endpoint,
    model: options.model,
    summary: {
      totalTests,
      passedTests,
      scorePercent,
      avgTps,
      avgTtftMs,
      categoryScores
    },
    results
  }

  saveBenchmarkRun(runData)
  return runData
}

export async function executeContextCurve(
  window: BrowserWindow | null,
  options: {
    endpoint: string
    apiKey?: string
    model: string
  }
): Promise<ContextCurvePoint[]> {
  isCancelled = false
  const points: ContextCurvePoint[] = []

  for (let i = 0; i < CONTEXT_LENGTH_PROMPTS.length; i++) {
    if (isCancelled) break
    const item = CONTEXT_LENGTH_PROMPTS[i]
    const prompt = item.promptGenerator()

    window?.webContents.send('context_curve:progress', {
      currentIndex: i,
      total: CONTEXT_LENGTH_PROMPTS.length,
      currentSize: item.size
    })

    try {
      const completion = await streamChatCompletion({
        endpoint: options.endpoint,
        apiKey: options.apiKey,
        model: options.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        onChunk: (delta, tokenCount, currentTps) => {
          window?.webContents.send('context_curve:chunk', {
            contextSize: item.size,
            delta,
            tokenCount,
            currentTps
          })
        }
      })

      const pt: ContextCurvePoint = {
        contextSize: item.size,
        actualTokens: completion.promptTokens,
        ttftMs: completion.ttftMs,
        generationTps: completion.generationTps,
        totalDurationMs: completion.totalDurationMs
      }
      points.push(pt)
      window?.webContents.send('context_curve:point_completed', pt)
    } catch (err: any) {
      console.warn(`Context curve point ${item.size} reached capacity limit: ${err.message}`)
      window?.webContents.send('context_curve:error', {
        contextSize: item.size,
        message: err.message.includes('exceed') 
          ? `Model context limit reached at ${item.size} tokens (Backend allocated max context window reached)` 
          : err.message
      })
    }
  }

  return points
}

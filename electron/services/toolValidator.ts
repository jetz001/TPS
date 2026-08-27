import { TestCase } from '../../src/types'

export interface ToolValidationResult {
  passed: boolean
  errors: string[]
  parsedCalls: Array<{
    name: string
    arguments: Record<string, any>
  }>
}

export function validateToolCalls(
  testCase: TestCase,
  rawResponse: string,
  toolCalls?: Array<{ function: { name: string; arguments: string } }>
): ToolValidationResult {
  const errors: string[] = []
  const parsedCalls: Array<{ name: string; arguments: Record<string, any> }> = []

  // Extract tool calls from OpenAI format or JSON fallback
  if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
    for (const call of toolCalls) {
      try {
        const parsedArgs = typeof call.function.arguments === 'string' 
          ? JSON.parse(call.function.arguments) 
          : call.function.arguments || {}
        parsedCalls.push({
          name: call.function.name,
          arguments: parsedArgs
        })
      } catch (err: any) {
        errors.push(`Failed to parse tool arguments JSON for "${call.function.name}": ${err.message}`)
        parsedCalls.push({
          name: call.function.name,
          arguments: { _raw: call.function.arguments }
        })
      }
    }
  } else {
    // Attempt fallback parsing from raw text if model outputs Markdown/JSON tool call
    const jsonMatch = rawResponse.match(/```json\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/)
      || rawResponse.match(/(\{[\s\S]*"name"\s*:\s*".*?"[\s\S]*\})/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.name) parsedCalls.push({ name: item.name, arguments: item.arguments || item.parameters || {} })
          }
        } else if (parsed.name) {
          parsedCalls.push({ name: parsed.name, arguments: parsed.arguments || parsed.parameters || {} })
        }
      } catch {
        // Ignore fallback failure
      }
    }
  }

  // 1. Check call type expectation
  if (testCase.expectedCallType === 'none') {
    if (parsedCalls.length > 0) {
      errors.push(`Expected NO tool calls (restraint), but model made ${parsedCalls.length} call(s): ${parsedCalls.map(c => c.name).join(', ')}`)
    }
    // Check keyword presence if any
    if (testCase.expectedTextKeywords && testCase.expectedTextKeywords.length > 0) {
      const lowerResponse = rawResponse.toLowerCase()
      const hasAnyKeyword = testCase.expectedTextKeywords.some(k => lowerResponse.includes(k.toLowerCase()))
      if (!hasAnyKeyword) {
        errors.push(`Response should contain one of expected keywords: [${testCase.expectedTextKeywords.join(', ')}]`)
      }
    }
  } else if (testCase.expectedCallType === 'single') {
    if (parsedCalls.length === 0) {
      errors.push(`Expected 1 tool call, but none was triggered. Model returned raw text instead.`)
    } else if (parsedCalls.length > 1) {
      errors.push(`Expected exactly 1 tool call, but received ${parsedCalls.length}`)
    }
  } else if (testCase.expectedCallType === 'multiple') {
    if (parsedCalls.length < 2) {
      errors.push(`Expected multiple parallel tool calls (>= 2), but received ${parsedCalls.length}`)
    }
  }

  // 2. Validate expected tool names and parameters
  if (testCase.expectedCalls && testCase.expectedCalls.length > 0) {
    for (let i = 0; i < testCase.expectedCalls.length; i++) {
      const expected = testCase.expectedCalls[i]
      const matchingCall = parsedCalls.find(c => c.name.toLowerCase() === expected.name.toLowerCase())

      if (!matchingCall) {
        errors.push(`Missing expected tool call: "${expected.name}"`)
      } else {
        // Check required argument keys
        if (expected.requiredArgs) {
          for (const reqArg of expected.requiredArgs) {
            if (matchingCall.arguments[reqArg] === undefined || matchingCall.arguments[reqArg] === null) {
              errors.push(`Tool "${expected.name}" is missing required parameter "${reqArg}". Received keys: [${Object.keys(matchingCall.arguments).join(', ')}]`)
            }
          }
        }
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    parsedCalls
  }
}

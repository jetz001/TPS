import http from 'http'
import https from 'https'
import { URL } from 'url'
import { ToolDefinition, ChunkTiming } from '../../src/types'

export interface ChatCompletionRequest {
  endpoint: string
  apiKey?: string
  model: string
  messages: Array<{ role: string; content: string; name?: string; tool_call_id?: string; tool_calls?: any[] }>
  tools?: ToolDefinition[]
  temperature?: number
  max_tokens?: number
  onChunk?: (textDelta: string, tokenIndex: number, currentTps: number) => void
}

export interface ChatCompletionResult {
  fullText: string
  toolCalls: Array<{
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }>
  ttftMs: number
  generationTps: number
  totalDurationMs: number
  promptTokens: number
  completionTokens: number
  chunkTimings: ChunkTiming[]
  rawResponseJson?: any
}

export async function fetchAvailableModels(endpoint: string, apiKey?: string): Promise<string[]> {
  const cleanEndpoint = endpoint.replace(/\/+$/, '')
  
  // Try /v1/models (Standard OpenAI API)
  try {
    const url = cleanEndpoint.endsWith('/v1') ? `${cleanEndpoint}/models` : `${cleanEndpoint}/v1/models`
    const res = await makeHttpRequest(url, 'GET', undefined, apiKey)
    const json = JSON.parse(res.body)
    if (json && Array.isArray(json.data)) {
      return json.data.map((m: any) => m.id || m.name).filter(Boolean)
    }
  } catch {
    // Fallback: try Ollama native endpoint /api/tags if base host
  }

  try {
    const parsed = new URL(cleanEndpoint)
    const ollamaUrl = `${parsed.protocol}//${parsed.host}/api/tags`
    const res = await makeHttpRequest(ollamaUrl, 'GET', undefined, apiKey)
    const json = JSON.parse(res.body)
    if (json && Array.isArray(json.models)) {
      return json.models.map((m: any) => m.name || m.model).filter(Boolean)
    }
  } catch (err: any) {
    throw new Error(`Failed to fetch models from ${endpoint}: ${err.message}`)
  }

  return []
}

export async function streamChatCompletion(req: ChatCompletionRequest, maxRetries = 2): Promise<ChatCompletionResult> {
  let attempt = 0
  while (attempt <= maxRetries) {
    try {
      return await executeSingleStreamRequest(req)
    } catch (err: any) {
      const isRateLimit = err.message && (err.message.includes('429') || err.message.includes('rate-limited') || err.message.includes('Rate limit') || err.message.includes('temporarily'))
      if (attempt < maxRetries && isRateLimit) {
        attempt++
        const waitMs = 3000 * attempt
        console.warn(`[Retry ${attempt}/${maxRetries}] Hit upstream rate limit (429), waiting ${waitMs}ms before retrying...`)
        await new Promise(resolve => setTimeout(resolve, waitMs))
      } else {
        throw err
      }
    }
  }
  throw new Error('Maximum request retries exceeded')
}

async function executeSingleStreamRequest(req: ChatCompletionRequest): Promise<ChatCompletionResult> {
  const cleanEndpoint = req.endpoint.replace(/\/+$/, '')
  const url = cleanEndpoint.endsWith('/v1') 
    ? `${cleanEndpoint}/chat/completions` 
    : `${cleanEndpoint}/v1/chat/completions`

  const payload: any = {
    model: req.model,
    messages: req.messages,
    stream: true,
    temperature: req.temperature ?? 0.1,
    max_tokens: req.max_tokens ?? 1024,
    stream_options: { include_usage: true }
  }

  if (req.tools && req.tools.length > 0) {
    payload.tools = req.tools
    payload.tool_choice = 'auto'
  }

  const startTime = Date.now()
  let firstTokenTime: number | null = null
  let fullText = ''
  const toolCallsMap: Record<number, { id: string; name: string; arguments: string }> = {}
  const chunkTimings: ChunkTiming[] = []
  let tokenCount = 0
  let promptTokens = 0
  let completionTokens = 0

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const isHttps = parsedUrl.protocol === 'https:'
    const transport = isHttps ? https : http

    const bodyData = JSON.stringify(payload)
    const requestOptions: http.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyData),
        ...(req.apiKey ? { 'Authorization': `Bearer ${req.apiKey}` } : {})
      },
      timeout: 60000
    }

    const clientReq = transport.request(requestOptions, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        let errBody = ''
        res.on('data', chunk => { errBody += chunk })
        res.on('end', () => {
          reject(new Error(`API returned HTTP ${res.statusCode}: ${errBody}`))
        })
        return
      }

      let buffer = ''

      res.on('data', (chunkBuffer: Buffer) => {
        buffer += chunkBuffer.toString('utf8')
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data:')) continue
          if (trimmed === 'data: [DONE]') continue

          const jsonStr = trimmed.substring(5).trim()
          try {
            const data = JSON.parse(jsonStr)
            
            // Check usage from final stream chunk
            if (data.usage) {
              promptTokens = data.usage.prompt_tokens || promptTokens
              completionTokens = data.usage.completion_tokens || completionTokens
            }

            const choice = data.choices && data.choices[0]
            if (!choice) continue

            const delta = choice.delta
            if (!delta) continue

            // First token arrival
            if (firstTokenTime === null) {
              firstTokenTime = Date.now()
            }

            // Text delta
            if (delta.content) {
              fullText += delta.content
              tokenCount++

              const now = Date.now()
              const elapsedSec = Math.max((now - firstTokenTime) / 1000, 0.001)
              const currentTps = Number((tokenCount / elapsedSec).toFixed(2))

              chunkTimings.push({
                timestamp: now - startTime,
                tokenCount,
                instantaneousTps: currentTps
              })

              if (req.onChunk) {
                req.onChunk(delta.content, tokenCount, currentTps)
              }
            }

            // Tool call deltas
            if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0
                if (!toolCallsMap[idx]) {
                  toolCallsMap[idx] = {
                    id: tc.id || `call_${idx}`,
                    name: '',
                    arguments: ''
                  }
                }
                if (tc.id && (!toolCallsMap[idx].id || toolCallsMap[idx].id.startsWith('call_'))) {
                  toolCallsMap[idx].id = tc.id
                }
                if (tc.function?.name) {
                  if (!toolCallsMap[idx].name) {
                    toolCallsMap[idx].name = tc.function.name
                  } else if (tc.function.name !== toolCallsMap[idx].name && !toolCallsMap[idx].name.includes(tc.function.name)) {
                    toolCallsMap[idx].name += tc.function.name
                  }
                }
                if (tc.function?.arguments) {
                  toolCallsMap[idx].arguments += tc.function.arguments
                }
              }
            }
          } catch {
            // Ignore partial SSE chunk parse error
          }
        }
      })

      res.on('end', () => {
        const endTime = Date.now()
        const totalDurationMs = endTime - startTime
        const ttftMs = firstTokenTime ? (firstTokenTime - startTime) : totalDurationMs
        const genDurationSec = firstTokenTime ? Math.max((endTime - firstTokenTime) / 1000, 0.001) : (totalDurationMs / 1000)
        
        // If completion tokens wasn't returned by usage, estimate
        if (completionTokens === 0) {
          // Token estimate: ~0.75 words per token or simple count
          completionTokens = tokenCount > 0 ? tokenCount : Math.ceil(fullText.length / 3.8)
        }
        if (promptTokens === 0) {
          promptTokens = Math.ceil(JSON.stringify(req.messages).length / 4)
        }

        const generationTps = Number((completionTokens / genDurationSec).toFixed(2))

        const formattedToolCalls = Object.values(toolCallsMap).map(tc => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.name,
            arguments: tc.arguments
          }
        }))

        resolve({
          fullText,
          toolCalls: formattedToolCalls,
          ttftMs,
          generationTps,
          totalDurationMs,
          promptTokens,
          completionTokens,
          chunkTimings
        })
      })
    })

    clientReq.on('error', (err) => {
      reject(new Error(`Network request error: ${err.message}`))
    })

    clientReq.write(bodyData)
    clientReq.end()
  })
}

function makeHttpRequest(urlStr: string, method = 'GET', body?: any, apiKey?: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr)
    const isHttps = parsed.protocol === 'https:'
    const transport = isHttps ? https : http

    const bodyStr = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null

    const opts: http.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
      },
      timeout: 10000
    }

    const req = transport.request(opts, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        resolve({ statusCode: res.statusCode || 0, body: data })
      })
    })

    req.on('error', reject)
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

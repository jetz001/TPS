export type TestCategory = 
  | 'tps_speed'
  | 'single_tool'
  | 'multi_tool_routing'
  | 'parallel_tool'
  | 'schema_strictness'
  | 'tool_restraint'
  | 'context_curve'

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required?: string[]
      [key: string]: any
    }
  }
}

export interface ExpectedCall {
  name: string
  argumentsPattern?: Record<string, any>
  requiredArgs?: string[]
}

export interface TestCase {
  id: string
  category: TestCategory
  name: string
  description: string
  prompt: string
  systemPrompt?: string
  tools?: ToolDefinition[]
  expectedCallType: 'single' | 'multiple' | 'none' | 'any'
  expectedCalls?: ExpectedCall[]
  expectedTextKeywords?: string[]
  maxTokens?: number
}

export interface ChunkTiming {
  timestamp: number
  tokenCount: number
  instantaneousTps: number
}

export interface TestResult {
  testId: string
  category: TestCategory
  name: string
  passed: boolean
  ttftMs: number
  generationTps: number
  totalDurationMs: number
  promptTokens: number
  completionTokens: number
  rawPrompt: string
  rawResponse: string
  toolCallsMade: Array<{
    name: string
    arguments: Record<string, any>
  }>
  evalErrors: string[]
  chunkTimings?: ChunkTiming[]
  toolExecutionResults?: Array<{
    toolName: string
    output: any
  }>
  outputAfterTools?: string
  secondTurnTps?: number
}

export type ProviderType = 'local' | 'cloud'

export interface ProviderPreset {
  id: string
  name: string
  type: ProviderType
  defaultUrl: string
  recommendedModels: string[]
  envKeyNames?: string[]
  docsUrl?: string
}

export interface BenchmarkRun {
  id: string
  timestamp: string
  endpoint: string
  model: string
  providerType?: ProviderType
  providerName?: string
  summary: {
    totalTests: number
    passedTests: number
    scorePercent: number
    avgTps: number
    avgTtftMs: number
    categoryScores: Record<string, { total: number; passed: number; percent: number }>
  }
  results: TestResult[]
}

export interface ContextCurvePoint {
  contextSize: number
  actualTokens: number
  ttftMs: number
  generationTps: number
  totalDurationMs: number
}

export interface SandboxMessage {
  role: 'user' | 'assistant' | 'tool' | 'system'
  content: string
  tool_call_id?: string
  name?: string
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }>
}

export interface HwTelemetry {
  cpuUsagePercent: number
  totalMemGB: number
  usedMemGB: number
  freeMemGB: number
  memUsagePercent: number
}

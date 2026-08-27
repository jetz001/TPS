/// <reference types="vite/client" />

export interface ElectronAPI {
  fetchModels: (endpoint: string, apiKey?: string) => Promise<string[]>
  startBenchmark: (options: any) => Promise<any>
  cancelBenchmark: () => Promise<boolean>
  startContextCurve: (options: any) => Promise<any>
  getHwTelemetry: () => Promise<any>
  getHistory: () => Promise<any[]>
  clearHistory: () => Promise<boolean>
  getProviderKeys: () => Promise<Record<string, string>>
  saveProviderKey: (providerId: string, key: string) => Promise<boolean>
  syncEnvKeys: () => Promise<Record<string, string>>
  executeMockTool: (name: string, args: Record<string, any>) => Promise<any>
  sandboxChat: (req: any) => Promise<any>
  onBenchmarkProgress: (callback: (data: any) => void) => () => void
  onBenchmarkChunk: (callback: (data: any) => void) => () => void
  onBenchmarkTestCompleted: (callback: (data: any) => void) => () => void
  onContextCurveProgress: (callback: (data: any) => void) => () => void
  onContextCurveChunk: (callback: (data: any) => void) => () => void
  onContextCurvePointCompleted: (callback: (data: any) => void) => () => void
  onContextCurveError: (callback: (data: any) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

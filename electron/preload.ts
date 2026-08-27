import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  fetchModels: (endpoint: string, apiKey?: string) => 
    ipcRenderer.invoke('llm:fetchModels', endpoint, apiKey),
    
  startBenchmark: (options: any) => 
    ipcRenderer.invoke('benchmark:start', options),
    
  cancelBenchmark: () => 
    ipcRenderer.invoke('benchmark:cancel'),
    
  startContextCurve: (options: any) => 
    ipcRenderer.invoke('context_curve:start', options),
    
  getHwTelemetry: () => 
    ipcRenderer.invoke('system:getTelemetry'),
    
  getHistory: () => 
    ipcRenderer.invoke('storage:getHistory'),
    
  clearHistory: () => 
    ipcRenderer.invoke('storage:clearHistory'),
    
  executeMockTool: (name: string, args: Record<string, any>) => 
    ipcRenderer.invoke('mock:executeTool', name, args),
    
  sandboxChat: (req: any) => 
    ipcRenderer.invoke('sandbox:chat', req),

  onBenchmarkProgress: (callback: (data: any) => void) => {
    const sub = (_: any, data: any) => callback(data)
    ipcRenderer.on('benchmark:progress', sub)
    return () => ipcRenderer.removeListener('benchmark:progress', sub)
  },

  onBenchmarkChunk: (callback: (data: any) => void) => {
    const sub = (_: any, data: any) => callback(data)
    ipcRenderer.on('benchmark:chunk', sub)
    return () => ipcRenderer.removeListener('benchmark:chunk', sub)
  },

  onBenchmarkTestCompleted: (callback: (data: any) => void) => {
    const sub = (_: any, data: any) => callback(data)
    ipcRenderer.on('benchmark:test_completed', sub)
    return () => ipcRenderer.removeListener('benchmark:test_completed', sub)
  },

  onContextCurveProgress: (callback: (data: any) => void) => {
    const sub = (_: any, data: any) => callback(data)
    ipcRenderer.on('context_curve:progress', sub)
    return () => ipcRenderer.removeListener('context_curve:progress', sub)
  },

  onContextCurveChunk: (callback: (data: any) => void) => {
    const sub = (_: any, data: any) => callback(data)
    ipcRenderer.on('context_curve:chunk', sub)
    return () => ipcRenderer.removeListener('context_curve:chunk', sub)
  },

  onContextCurvePointCompleted: (callback: (data: any) => void) => {
    const sub = (_: any, data: any) => callback(data)
    ipcRenderer.on('context_curve:point_completed', sub)
    return () => ipcRenderer.removeListener('context_curve:point_completed', sub)
  },

  onContextCurveError: (callback: (data: any) => void) => {
    const sub = (_: any, data: any) => callback(data)
    ipcRenderer.on('context_curve:error', sub)
    return () => ipcRenderer.removeListener('context_curve:error', sub)
  }
})

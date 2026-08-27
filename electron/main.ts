import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { fetchAvailableModels, streamChatCompletion } from './services/llmClient'
import { executeBenchmarkSuite, executeContextCurve, cancelCurrentBenchmark } from './services/benchmarkRunner'
import { getSystemTelemetry } from './services/hwMonitor'
import { loadBenchmarkHistory, clearBenchmarkHistory } from './services/storage'
import { executeMockTool } from './services/mockExecutor'
import { COMMON_TOOLS } from './suites/builtInSuites'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    title: 'Local AI Benchmark — TPS & Tool Intelligence',
    backgroundColor: '#090d16',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  mainWindow.setMenuBarVisibility(false)

  const distPath = path.join(__dirname, '../../dist/index.html')
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath)
  } else {
    mainWindow.loadURL('http://localhost:5173')
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  // IPC Handlers
  ipcMain.handle('llm:fetchModels', async (_, endpoint: string, apiKey?: string) => {
    return await fetchAvailableModels(endpoint, apiKey)
  })

  ipcMain.handle('benchmark:start', async (_, options: any) => {
    return await executeBenchmarkSuite(mainWindow, options)
  })

  ipcMain.handle('benchmark:cancel', () => {
    cancelCurrentBenchmark()
    return true
  })

  ipcMain.handle('context_curve:start', async (_, options: any) => {
    return await executeContextCurve(mainWindow, options)
  })

  ipcMain.handle('system:getTelemetry', () => {
    return getSystemTelemetry()
  })

  ipcMain.handle('storage:getHistory', () => {
    return loadBenchmarkHistory()
  })

  ipcMain.handle('storage:clearHistory', () => {
    clearBenchmarkHistory()
    return true
  })

  ipcMain.handle('mock:executeTool', async (_, name: string, args: Record<string, any>) => {
    return await executeMockTool(name, args)
  })

  ipcMain.handle('sandbox:chat', async (_, req: any) => {
    const tools = Object.values(COMMON_TOOLS)
    return await streamChatCompletion({
      endpoint: req.endpoint,
      apiKey: req.apiKey,
      model: req.model,
      messages: req.messages,
      tools,
      temperature: 0.2
    })
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { BenchmarkRun } from '../../src/types'

function getStoragePath(): string {
  const userDataDir = app ? app.getPath('userData') : process.cwd()
  return path.join(userDataDir, 'tps_benchmark_history.json')
}

export function loadBenchmarkHistory(): BenchmarkRun[] {
  try {
    const filePath = getStoragePath()
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(data)
    }
  } catch (err) {
    console.error('Failed to load benchmark history:', err)
  }
  return []
}

export function saveBenchmarkRun(run: BenchmarkRun): void {
  try {
    const history = loadBenchmarkHistory()
    history.unshift(run)
    // Keep last 50 runs
    const trimmed = history.slice(0, 50)
    fs.writeFileSync(getStoragePath(), JSON.stringify(trimmed, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to save benchmark run:', err)
  }
}

export function clearBenchmarkHistory(): void {
  try {
    const filePath = getStoragePath()
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (err) {
    console.error('Failed to clear benchmark history:', err)
  }
}

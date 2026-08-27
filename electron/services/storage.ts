import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { BenchmarkRun } from '../../src/types'

function getStoragePath(): string {
  const userDataDir = app ? app.getPath('userData') : process.cwd()
  return path.join(userDataDir, 'tps_benchmark_history.json')
}

function getKeysStoragePath(): string {
  const userDataDir = app ? app.getPath('userData') : process.cwd()
  return path.join(userDataDir, 'tps_provider_keys.json')
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

const DEFAULT_PRESET_KEYS: Record<string, string> = {}

export function loadProviderKeys(): Record<string, string> {
  const keys: Record<string, string> = { ...DEFAULT_PRESET_KEYS }
  try {
    const filePath = getKeysStoragePath()
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      Object.assign(keys, JSON.parse(data))
    }
  } catch (err) {
    console.error('Failed to load provider keys:', err)
  }

  // Also auto-sync from .env files
  const envKeys = syncEnvKeys()
  for (const [providerId, key] of Object.entries(envKeys)) {
    if (key) {
      keys[providerId] = key
    }
  }

  return keys
}

export function saveProviderKey(providerId: string, key: string): void {
  try {
    const filePath = getKeysStoragePath()
    let currentKeys: Record<string, string> = {}
    if (fs.existsSync(filePath)) {
      try {
        currentKeys = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      } catch {}
    }
    if (key.trim()) {
      currentKeys[providerId] = key.trim()
    } else {
      delete currentKeys[providerId]
    }
    fs.writeFileSync(filePath, JSON.stringify(currentKeys, null, 2), 'utf-8')
  } catch (err) {
    console.error(`Failed to save key for ${providerId}:`, err)
  }
}

export function syncEnvKeys(): Record<string, string> {
  const detectedKeys: Record<string, string> = {}
  const candidatePaths = [
    'D:\\AgentAI\\AgentResearch\\Config\\.env',
    'D:\\AgentAI\\AgentResearch\\.env',
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '..', '.env')
  ]

  for (const envPath of candidatePaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8')
        const lines = content.split('\n')
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) continue
          const [rawKey, ...valParts] = trimmed.split('=')
          const keyName = rawKey.trim().toUpperCase()
          const val = valParts.join('=').trim().replace(/^["']|["']$/g, '')

          if (!val) continue

          if (keyName.includes('OPENROUTER') || keyName === 'OPENROUTER_API_KEY') {
            detectedKeys['openrouter'] = val
          } else if (keyName.includes('DEEPSEEK') || keyName === 'DEEPSEEK_API_KEY') {
            detectedKeys['deepseek'] = val
          } else if (keyName.includes('GROQ') || keyName === 'GROQ_API_KEY') {
            detectedKeys['groq'] = val
          } else if (keyName.includes('OPENAI') || keyName === 'OPENAI_API_KEY') {
            detectedKeys['openai'] = val
          } else if (keyName.includes('GEMINI') || keyName.includes('GOOGLE_API_KEY')) {
            detectedKeys['gemini'] = val
          } else if (keyName.includes('MISTRAL') || keyName === 'WRITER_API_KEY' || keyName === 'QA_API_KEY' || keyName === 'ADVISOR_API_KEY') {
            detectedKeys['mistral'] = val
          } else if (keyName.includes('TOGETHER') || keyName === 'TOGETHER_API_KEY') {
            detectedKeys['together'] = val
          } else if (keyName === 'OLLAMA_API_KEY' || keyName === 'RESEARCH_API_KEY') {
            detectedKeys['ollama_cloud'] = val
          }
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  return detectedKeys
}

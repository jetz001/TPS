import React, { useState, useEffect } from 'react'
import { Server, RefreshCw, Key, CheckCircle2, AlertCircle, Eye, EyeOff, Globe, Laptop, ExternalLink } from 'lucide-react'
import { HwTelemetryBar } from './common/HwTelemetryBar'
import { MetricsGlossary } from './common/MetricsGlossary'
import { PROVIDER_PRESETS } from '../config/providers'
import { ProviderPreset, ProviderType } from '../types'
import logoImg from '../assets/logo.jpg'

interface HeaderProps {
  endpoint: string
  setEndpoint: (ep: string) => void
  apiKey: string
  setApiKey: (k: string) => void
  selectedModel: string
  setSelectedModel: (m: string) => void
  availableModels: string[]
  setAvailableModels: (models: string[]) => void
  isConnected: boolean
  setIsConnected: (c: boolean) => void
  selectedProvider: ProviderPreset
  setSelectedProvider: (p: ProviderPreset) => void
}

export const Header: React.FC<HeaderProps> = ({
  endpoint,
  setEndpoint,
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel,
  availableModels,
  setAvailableModels,
  isConnected,
  setIsConnected,
  selectedProvider,
  setSelectedProvider
}) => {
  const [providerType, setProviderType] = useState<ProviderType>('local')
  const [isFetching, setIsFetching] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>({})

  // Load saved and synced keys from backend on mount
  useEffect(() => {
    const loadKeys = async () => {
      if (window.electronAPI?.getProviderKeys) {
        try {
          const keys = await window.electronAPI.getProviderKeys()
          if (keys) {
            setSavedKeys(keys)
            // If current provider has a key, auto-set it
            if (keys[selectedProvider.id]) {
              setApiKey(keys[selectedProvider.id])
            }
          }
        } catch (e) {
          console.warn('Failed to load keys:', e)
        }
      }
    }
    loadKeys()
  }, [])

  // When selected provider changes, auto-load its default endpoint, key, and recommended model
  const handleSelectProvider = (provider: ProviderPreset) => {
    setSelectedProvider(provider)
    setEndpoint(provider.defaultUrl)
    setIsConnected(false)

    // Load key for this provider if saved
    const key = savedKeys[provider.id] || ''
    setApiKey(key)

    // Set recommended model
    if (provider.recommendedModels && provider.recommendedModels.length > 0) {
      setSelectedModel(provider.recommendedModels[0])
      setAvailableModels(provider.recommendedModels)
    }
  }

  // Handle API key change & auto-save to backend
  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey)
    setSavedKeys(prev => ({ ...prev, [selectedProvider.id]: newKey }))
    if (window.electronAPI?.saveProviderKey) {
      window.electronAPI.saveProviderKey(selectedProvider.id, newKey)
    }
  }

  const handleFetchModels = async () => {
    setIsFetching(true)
    setErrorMsg(null)
    try {
      if (window.electronAPI?.fetchModels) {
        const models = await window.electronAPI.fetchModels(endpoint, apiKey)
        if (models && models.length > 0) {
          setAvailableModels(models)
          if (!selectedModel || !models.includes(selectedModel)) {
            setSelectedModel(models[0])
          }
          setIsConnected(true)
        } else {
          setErrorMsg('No models returned by provider')
          setIsConnected(false)
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection failed')
      setIsConnected(false)
    } finally {
      setIsFetching(false)
    }
  }

  const currentCategoryPresets = PROVIDER_PRESETS.filter(p => p.type === providerType)

  return (
    <header className="bg-surface border-b border-surface-light px-5 py-3 flex flex-col gap-3 sticky top-0 z-50 shadow-md">
      {/* Top Row: Brand + Telemetry + Glossary */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/20 border border-cyan-500/30 flex-shrink-0 bg-background">
            <img src={logoImg} alt="App Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-base tracking-tight text-white">NeuroSpeed Benchmark</h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 font-semibold border border-primary-500/30">
                TPS & 5D Tools
              </span>
            </div>
            <p className="text-xs text-slate-400">Universal Local & Cloud LLM Intelligence Evaluator</p>
          </div>
        </div>

        {/* Right Controls: Telemetry & Metrics Glossary */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
          <HwTelemetryBar />
          <MetricsGlossary />
        </div>
      </div>

      {/* Bottom Row: Provider Bar & Connection Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-light/60">
        {/* Left: Provider Mode Switcher (Local vs Cloud) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Tabs: Local / Cloud */}
          <div className="flex bg-surface-light p-0.5 rounded-lg border border-surface-lighter text-xs font-mono">
            <button
              onClick={() => {
                setProviderType('local')
                const firstLocal = PROVIDER_PRESETS.find(p => p.type === 'local')
                if (firstLocal) handleSelectProvider(firstLocal)
              }}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
                providerType === 'local'
                  ? 'bg-primary-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Local 💻</span>
            </button>
            <button
              onClick={() => {
                setProviderType('cloud')
                const firstCloud = PROVIDER_PRESETS.find(p => p.type === 'cloud')
                if (firstCloud) handleSelectProvider(firstCloud)
              }}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
                providerType === 'cloud'
                  ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Cloud ☁️</span>
            </button>
          </div>

          {/* Provider Specific Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-surface-light/40 p-1 rounded-lg border border-surface-lighter/60 text-xs">
            {currentCategoryPresets.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelectProvider(p)}
                className={`px-2.5 py-1 rounded-md transition-all font-mono text-xs ${
                  selectedProvider.id === p.id
                    ? 'bg-primary-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-light'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right: API Key + Model Selection + Connect Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* API Key Input (Highlighted if Cloud) */}
          {(selectedProvider.type === 'cloud' || apiKey) && (
            <div className="relative flex items-center">
              <input
                type={showApiKey ? 'text' : 'password'}
                placeholder={`API Key for ${selectedProvider.name}...`}
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="bg-background border border-surface-lighter focus:border-accent-cyan rounded-lg pl-7 pr-8 py-1.5 text-xs text-slate-200 font-mono outline-none w-48 sm:w-60"
              />
              <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 text-slate-400 hover:text-slate-200"
                title={showApiKey ? 'Hide Key' : 'Show Key'}
              >
                {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Editable & Searchable Model Input (Type any model or pick from preset list) */}
          <div className="relative flex items-center">
            <input
              type="text"
              list="header-available-models-list"
              placeholder="Select or type custom model..."
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-background border border-surface-light focus:border-primary-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono outline-none w-56 sm:w-72 shadow-inner"
              title="พิมพ์ชื่อโมเดลเองได้อิสระ หรือเลือกจากรายการที่แนะนำ"
            />
            <datalist id="header-available-models-list">
              {availableModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </datalist>
          </div>

          {/* Fetch Models Button */}
          <button
            onClick={handleFetchModels}
            disabled={isFetching}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-all shadow-md shadow-primary-600/20 font-mono"
          >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isFetching ? 'Connecting...' : 'Fetch'}</span>
            </button>

            {isConnected ? (
              <span className="flex items-center text-accent-emerald text-xs gap-1 font-medium bg-accent-emerald/10 px-2 py-1 rounded-md border border-accent-emerald/20 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready
              </span>
            ) : (
              <span className="flex items-center text-slate-400 text-xs gap-1 bg-surface-light px-2 py-1 rounded-md font-mono">
                <AlertCircle className="w-3.5 h-3.5" /> Idle
              </span>
            )}
          </div>
        </div>

        {errorMsg && (
        <div className="bg-accent-rose/90 text-white text-xs px-4 py-1.5 rounded-lg shadow-lg font-medium animate-fadeIn flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-white hover:text-slate-200 font-bold ml-2">✕</button>
        </div>
      )}
    </header>
  )
}

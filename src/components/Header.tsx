import React, { useState } from 'react'
import { Server, RefreshCw, Key, CheckCircle2, AlertCircle } from 'lucide-react'
import { HwTelemetryBar } from './common/HwTelemetryBar'
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
}

const PRESET_ENDPOINTS = [
  { name: 'Ollama', url: 'http://localhost:11434/v1' },
  { name: 'LM Studio', url: 'http://localhost:1234/v1' },
  { name: 'vLLM / llama.cpp', url: 'http://localhost:8000/v1' }
]

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
  setIsConnected
}) => {
  const [isFetching, setIsFetching] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)

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
          setErrorMsg('No models found at endpoint')
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

  return (
    <header className="bg-surface border-b border-surface-light px-5 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/20 border border-cyan-500/30 flex-shrink-0 bg-background">
          <img src={logoImg} alt="App Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-base tracking-tight text-white">NeuroSpeed Benchmark</h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 font-semibold border border-primary-500/30">
              TPS & Tools
            </span>
          </div>
          <p className="text-xs text-slate-400">Tokens/Sec & Function Calling Intelligence Suite</p>
        </div>
      </div>

      {/* Connection Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Preset Switcher */}
        <div className="flex bg-surface-light rounded-lg p-0.5 border border-surface-lighter text-xs">
          {PRESET_ENDPOINTS.map(p => (
            <button
              key={p.name}
              onClick={() => {
                setEndpoint(p.url)
                setIsConnected(false)
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                endpoint === p.url
                  ? 'bg-primary-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Endpoint Input */}
        <div className="relative">
          <input
            type="text"
            value={endpoint}
            onChange={(e) => {
              setEndpoint(e.target.value)
              setIsConnected(false)
            }}
            placeholder="http://localhost:11434/v1"
            className="w-56 bg-background border border-surface-light focus:border-primary-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono outline-none transition-colors"
          />
        </div>

        {/* API Key Toggle/Input */}
        <div className="relative">
          {showApiKey ? (
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API Key (optional)"
              className="w-36 bg-background border border-surface-light focus:border-primary-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono outline-none"
            />
          ) : (
            <button
              onClick={() => setShowApiKey(true)}
              className="p-1.5 bg-surface-light hover:bg-surface-lighter border border-surface-lighter rounded-lg text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
              title="Add API Key"
            >
              <Key className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Fetch Models Button */}
        <button
          onClick={handleFetchModels}
          disabled={isFetching}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-all shadow-md shadow-primary-600/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>{isFetching ? 'Connecting...' : 'Fetch Models'}</span>
        </button>

        {/* Model Selector Dropdown */}
        <div className="flex items-center space-x-1.5">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={availableModels.length === 0}
            className="bg-background border border-surface-light focus:border-primary-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono outline-none max-w-[220px]"
          >
            {availableModels.length > 0 ? (
              availableModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))
            ) : (
              <option value="">(No models loaded)</option>
            )}
          </select>

          {isConnected ? (
            <span className="flex items-center text-accent-emerald text-xs gap-1 font-medium bg-accent-emerald/10 px-2 py-1 rounded-md border border-accent-emerald/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
            </span>
          ) : (
            <span className="flex items-center text-slate-400 text-xs gap-1 bg-surface-light px-2 py-1 rounded-md">
              <AlertCircle className="w-3.5 h-3.5" /> Not Connected
            </span>
          )}
        </div>

        {/* Telemetry */}
        <HwTelemetryBar />
      </div>

      {errorMsg && (
        <div className="absolute top-full left-0 right-0 bg-accent-rose/90 text-white text-xs px-5 py-1.5 text-center shadow-lg font-medium animate-fadeIn">
          {errorMsg}
        </div>
      )}
    </header>
  )
}

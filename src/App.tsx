import React, { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { BenchmarkTab } from './components/tabs/BenchmarkTab'
import { TpsCurveTab } from './components/tabs/TpsCurveTab'
import { ToolAnalysisTab } from './components/tabs/ToolAnalysisTab'
import { SandboxTab } from './components/tabs/SandboxTab'
import { LeaderboardTab } from './components/tabs/LeaderboardTab'
import { Zap, TrendingUp, Sparkles, Wrench, Trophy } from 'lucide-react'
import { BenchmarkRun, ProviderPreset } from './types'
import { PROVIDER_PRESETS } from './config/providers'

type ActiveTab = 'benchmark' | 'tps_curve' | 'tool_analysis' | 'sandbox' | 'leaderboard'

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('benchmark')
  const [selectedProvider, setSelectedProvider] = useState<ProviderPreset>(PROVIDER_PRESETS[0])
  const [endpoint, setEndpoint] = useState(PROVIDER_PRESETS[0].defaultUrl)
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState(PROVIDER_PRESETS[0].recommendedModels[0] || '')
  const [availableModels, setAvailableModels] = useState<string[]>(PROVIDER_PRESETS[0].recommendedModels)
  const [isConnected, setIsConnected] = useState(false)
  const [latestRun, setLatestRun] = useState<BenchmarkRun | null>(null)

  // Auto-fetch models on startup
  useEffect(() => {
    const initFetch = async () => {
      if (window.electronAPI?.fetchModels) {
        try {
          const models = await window.electronAPI.fetchModels(endpoint, apiKey)
          if (models && models.length > 0) {
            setAvailableModels(models)
            setSelectedModel(models[0])
            setIsConnected(true)
          }
        } catch {
          // not connected yet
        }
      }
    }
    initFetch()
  }, [])

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans select-none">
      {/* Top Header */}
      <Header
        endpoint={endpoint}
        setEndpoint={setEndpoint}
        apiKey={apiKey}
        setApiKey={setApiKey}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        availableModels={availableModels}
        setAvailableModels={setAvailableModels}
        isConnected={isConnected}
        setIsConnected={setIsConnected}
        selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider}
      />

      {/* Navigation Sub-Header */}
      <div className="bg-surface/80 border-b border-surface-light px-6 py-2 flex items-center justify-between sticky top-[108px] md:top-[98px] z-40 backdrop-blur-md">
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
          <button
            onClick={() => setActiveTab('benchmark')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'benchmark'
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-light/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ Benchmark Runner</span>
          </button>

          <button
            onClick={() => setActiveTab('tps_curve')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'tps_curve'
                ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-light/50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>📈 Context TPS Curve</span>
          </button>

          <button
            onClick={() => setActiveTab('tool_analysis')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'tool_analysis'
                ? 'bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-light/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🕸️ 5D Tool Radar</span>
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'sandbox'
                ? 'bg-accent-violet/20 text-accent-violet border border-accent-violet/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-light/50'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>🧪 Tool Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'leaderboard'
                ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-light/50'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>🏆 Leaderboard & Export</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono text-slate-500">
          <span>Target:</span>
          <span className="text-slate-300 font-semibold">{selectedModel || 'None'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-light text-accent-cyan border border-surface-lighter">
            {selectedProvider.name}
          </span>
        </div>
      </div>

      {/* Tab Content Body */}
      <main className="flex-1 overflow-y-auto pb-10">
        {activeTab === 'benchmark' && (
          <BenchmarkTab
            endpoint={endpoint}
            apiKey={apiKey}
            model={selectedModel}
            isConnected={isConnected}
            latestRun={latestRun}
            setLatestRun={setLatestRun}
            selectedProvider={selectedProvider}
          />
        )}

        {activeTab === 'tps_curve' && (
          <TpsCurveTab
            endpoint={endpoint}
            apiKey={apiKey}
            model={selectedModel}
            isConnected={isConnected}
          />
        )}

        {activeTab === 'tool_analysis' && (
          <ToolAnalysisTab
            latestRun={latestRun}
          />
        )}

        {activeTab === 'sandbox' && (
          <SandboxTab
            endpoint={endpoint}
            apiKey={apiKey}
            model={selectedModel}
            isConnected={isConnected}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardTab
            latestRun={latestRun}
          />
        )}
      </main>
    </div>
  )
}

export default App

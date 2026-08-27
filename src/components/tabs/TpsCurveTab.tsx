import React, { useState, useEffect } from 'react'
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, 
  CartesianGrid, Legend, AreaChart, Area 
} from 'recharts'
import { Play, TrendingDown, Clock, Zap, Activity } from 'lucide-react'
import { ContextCurvePoint } from '../../types'

interface TpsCurveTabProps {
  endpoint: string
  apiKey: string
  model: string
  isConnected: boolean
}

export const TpsCurveTab: React.FC<TpsCurveTabProps> = ({
  endpoint,
  apiKey,
  model,
  isConnected
}) => {
  const [points, setPoints] = useState<ContextCurvePoint[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [warningMsg, setWarningMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!window.electronAPI) return

    const unsubProgress = window.electronAPI.onContextCurveProgress((data) => {
      setProgress({
        current: data.currentIndex + 1,
        total: data.total,
        size: data.currentSize
      })
    })

    const unsubPoint = window.electronAPI.onContextCurvePointCompleted((pt: ContextCurvePoint) => {
      setPoints(prev => [...prev.filter(p => p.contextSize !== pt.contextSize), pt].sort((a, b) => a.contextSize - b.contextSize))
    })

    const unsubError = window.electronAPI.onContextCurveError?.((err: any) => {
      setWarningMsg(err.message || 'Context limit reached')
    })

    return () => {
      unsubProgress()
      unsubPoint()
      unsubError?.()
    }
  }, [])

  const handleRunCurve = async () => {
    if (!model) return
    setIsRunning(true)
    setPoints([])
    try {
      if (window.electronAPI?.startContextCurve) {
        const finalPoints = await window.electronAPI.startContextCurve({
          endpoint,
          apiKey,
          model
        })
        setPoints(finalPoints)
      }
    } catch (err) {
      console.error('Curve test error:', err)
    } finally {
      setIsRunning(false)
      setProgress(null)
    }
  }

  // Calculate degradation percentage from 512 to max tested
  let degradationPercent = 0
  if (points.length >= 2) {
    const first = points[0].generationTps
    const last = points[points.length - 1].generationTps
    if (first > 0) {
      degradationPercent = Math.round(((first - last) / first) * 100)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Trigger */}
      <div className="bg-surface rounded-xl p-6 border border-surface-light shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Context Length TPS Degradation Curve</h2>
            <span className="text-xs font-mono bg-surface-light text-accent-cyan px-2 py-0.5 rounded border border-surface-lighter">
              512 to 8,192 Tokens
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Evaluates how rapidly generation speed (TPS) drops and TTFT increases as the model's context window fills up.
          </p>
        </div>

        <button
          onClick={handleRunCurve}
          disabled={!model || isRunning}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-accent-cyan to-primary-600 hover:from-cyan-400 hover:to-primary-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{isRunning ? 'Running Curve Test...' : 'Run Context Scaling Benchmark'}</span>
        </button>
      </div>

      {/* Context Limit Warning */}
      {warningMsg && (
        <div className="bg-accent-amber/10 border border-accent-amber/40 rounded-xl p-4 text-xs font-mono text-amber-200 flex items-start space-x-3">
          <div className="font-bold text-accent-amber mt-0.5">⚠️ INFO:</div>
          <div>
            <p className="font-semibold">{warningMsg}</p>
            <p className="text-slate-400 mt-1 text-[11px]">
              Tip: Local Ollama models by default allocate a 4,096 token context window in VRAM. If your model supports 8k/32k/128k context, you can increase it by setting <code className="bg-background px-1.5 py-0.5 rounded text-accent-cyan">PARAMETER num_ctx 8192</code> in Ollama Modelfile.
            </p>
          </div>
        </div>
      )}

      {/* Running Progress */}
      {isRunning && progress && (
        <div className="bg-surface rounded-xl p-4 border border-accent-cyan/40 space-y-2 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span>Evaluating Context Size: <strong className="text-accent-cyan font-bold">{progress.size} tokens</strong></span>
            <span>Step {progress.current} of {progress.total}</span>
          </div>
          <div className="w-full bg-background h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-cyan transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Metrics Highlights */}
      {points.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface p-4 rounded-xl border border-surface-light">
            <span className="text-xs text-slate-400 uppercase font-mono flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent-amber" /> Base Speed (512 tokens)
            </span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {points[0]?.generationTps || 0} <span className="text-xs text-slate-400 font-sans">TPS</span>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-xl border border-surface-light">
            <span className="text-xs text-slate-400 uppercase font-mono flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-accent-rose" /> Speed Degradation
            </span>
            <div className="text-2xl font-black text-accent-rose font-mono mt-1">
              {degradationPercent > 0 ? `-${degradationPercent}%` : 'Stable (0%)'}
            </div>
          </div>

          <div className="bg-surface p-4 rounded-xl border border-surface-light">
            <span className="text-xs text-slate-400 uppercase font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent-cyan" /> Max TTFT Latency
            </span>
            <div className="text-2xl font-black text-accent-cyan font-mono mt-1">
              {Math.max(...points.map(p => p.ttftMs))} <span className="text-xs text-slate-400 font-sans">ms</span>
            </div>
          </div>
        </div>
      )}

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generation TPS vs Context Size */}
        <div className="bg-surface p-5 rounded-xl border border-surface-light shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent-amber" /> Generation TPS by Context Size
          </h3>
          <div className="h-64">
            {points.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points}>
                  <defs>
                    <linearGradient id="tpsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="contextSize" stroke="#64748b" tickFormatter={(v) => `${v}t`} />
                  <YAxis stroke="#64748b" unit=" tps" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} 
                  />
                  <Area type="monotone" dataKey="generationTps" name="Generation TPS" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#tpsGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                Click "Run Context Scaling Benchmark" to plot the graph.
              </div>
            )}
          </div>
        </div>

        {/* TTFT Latency vs Context Size */}
        <div className="bg-surface p-5 rounded-xl border border-surface-light shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-cyan" /> Time to First Token (TTFT) by Context Size
          </h3>
          <div className="h-64">
            {points.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points}>
                  <defs>
                    <linearGradient id="ttftGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="contextSize" stroke="#64748b" tickFormatter={(v) => `${v}t`} />
                  <YAxis stroke="#64748b" unit=" ms" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} 
                  />
                  <Area type="monotone" dataKey="ttftMs" name="TTFT (ms)" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#ttftGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                Click "Run Context Scaling Benchmark" to plot the graph.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { 
  Play, Square, CheckCircle, XCircle, Clock, Zap, Cpu, Terminal, 
  Layers, ChevronRight, FileText, Check, AlertTriangle 
} from 'lucide-react'
import { TestCategory, TestResult, BenchmarkRun } from '../../types'

interface BenchmarkTabProps {
  endpoint: string
  apiKey: string
  model: string
  isConnected: boolean
  latestRun: BenchmarkRun | null
  setLatestRun: (run: BenchmarkRun | null) => void
}

const CATEGORY_OPTIONS: Array<{ id: TestCategory; label: string; desc: string }> = [
  { id: 'tps_speed', label: '1. Raw Speed & TPS', desc: 'Measures Generation TPS, TTFT, and throughput on long outputs' },
  { id: 'single_tool', label: '2. Single Tool Calling', desc: 'Evaluates basic tool selection and parameter extraction' },
  { id: 'multi_tool_routing', label: '3. Multi-Tool Routing', desc: 'Tests routing accuracy among 5 competing tools' },
  { id: 'parallel_tool', label: '4. Parallel Tool Calling', desc: 'Tests triggering multiple tool calls in a single prompt' },
  { id: 'schema_strictness', label: '5. Schema Strictness', desc: 'Evaluates nested objects, arrays, and enum constraints' },
  { id: 'tool_restraint', label: '6. Tool Restraint (Negative)', desc: 'Ensures no hallucinations/tools on standard questions' },
]

export const BenchmarkTab: React.FC<BenchmarkTabProps> = ({
  endpoint,
  apiKey,
  model,
  isConnected,
  latestRun,
  setLatestRun
}) => {
  const [selectedCategories, setSelectedCategories] = useState<TestCategory[]>([
    'tps_speed',
    'single_tool',
    'multi_tool_routing',
    'parallel_tool',
    'schema_strictness',
    'tool_restraint'
  ])
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number; testName: string; category: string } | null>(null)
  const [liveStreamText, setLiveStreamText] = useState<string>('')
  const [liveTps, setLiveTps] = useState<number>(0)
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null)

  // Listen to IPC events from Electron
  useEffect(() => {
    if (!window.electronAPI) return

    const unsubProgress = window.electronAPI.onBenchmarkProgress((data) => {
      setProgress({
        current: data.currentIndex + 1,
        total: data.total,
        testName: data.currentTestName,
        category: data.category
      })
      setLiveStreamText('')
    })

    const unsubChunk = window.electronAPI.onBenchmarkChunk((data) => {
      setLiveStreamText(prev => prev + data.delta)
      setLiveTps(data.currentTps || 0)
    })

    const unsubCompleted = window.electronAPI.onBenchmarkTestCompleted((result: TestResult) => {
      setLatestRun(prev => {
        if (!prev) return null
        const updated = [...prev.results, result]
        return {
          ...prev,
          results: updated
        }
      })
    })

    return () => {
      unsubProgress()
      unsubChunk()
      unsubCompleted()
    }
  }, [setLatestRun])

  const toggleCategory = (cat: TestCategory) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat))
    } else {
      setSelectedCategories([...selectedCategories, cat])
    }
  }

  const handleStartBenchmark = async () => {
    if (!model) return
    setIsRunning(true)
    setProgress(null)
    setLiveStreamText('')
    setLiveTps(0)
    setSelectedResult(null)

    // Initial draft run state
    setLatestRun({
      id: `run_${Date.now()}`,
      timestamp: new Date().toISOString(),
      endpoint,
      model,
      summary: {
        totalTests: 0,
        passedTests: 0,
        scorePercent: 0,
        avgTps: 0,
        avgTtftMs: 0,
        categoryScores: {}
      },
      results: []
    })

    try {
      if (window.electronAPI?.startBenchmark) {
        const finalRun = await window.electronAPI.startBenchmark({
          endpoint,
          apiKey,
          model,
          categories: selectedCategories
        })
        setLatestRun(finalRun)
        if (finalRun.results.length > 0) {
          setSelectedResult(finalRun.results[0])
        }
      }
    } catch (err) {
      console.error('Benchmark execution error:', err)
    } finally {
      setIsRunning(false)
      setProgress(null)
    }
  }

  const handleCancel = async () => {
    if (window.electronAPI?.cancelBenchmark) {
      await window.electronAPI.cancelBenchmark()
      setIsRunning(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Run Trigger */}
      <div className="bg-surface rounded-xl p-6 border border-surface-light shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Run Benchmark Suite</h2>
            <span className="text-xs font-mono bg-surface-light text-primary-400 px-2 py-0.5 rounded border border-surface-lighter">
              Model: {model || '(None)'}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Measures generation token speed (TPS), latency (TTFT), and tests 5 core dimensions of Tool & Function Calling adherence.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full lg:w-auto">
          {isRunning ? (
            <button
              onClick={handleCancel}
              className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-accent-rose hover:bg-rose-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-accent-rose/20"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Cancel Benchmark</span>
            </button>
          ) : (
            <button
              onClick={handleStartBenchmark}
              disabled={!model}
              className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-cyan hover:from-primary-500 hover:to-cyan-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary-600/25 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Comprehensive Benchmark</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Checkboxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {CATEGORY_OPTIONS.map((cat) => {
          const isChecked = selectedCategories.includes(cat.id)
          return (
            <div
              key={cat.id}
              onClick={() => !isRunning && toggleCategory(cat.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start space-x-3 ${
                isChecked
                  ? 'bg-surface-light/80 border-primary-500/50 shadow-md shadow-primary-500/5'
                  : 'bg-surface/50 border-surface-light/50 opacity-60 hover:opacity-100'
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                isChecked ? 'bg-primary-600 text-white' : 'border border-slate-600'
              }`}>
                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-slate-200">{cat.label}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">{cat.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Live Running Progress & Stream Monitor */}
      {isRunning && progress && (
        <div className="bg-surface rounded-xl p-5 border border-primary-500/40 shadow-2xl space-y-4 animate-pulse-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-accent-cyan animate-ping" />
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-mono">
                  Test {progress.current} of {progress.total}
                </span>
                <h3 className="text-sm font-semibold text-white">{progress.testName}</h3>
              </div>
            </div>
            <div className="flex items-center space-x-4 font-mono text-xs">
              <div className="bg-background px-3 py-1.5 rounded-lg border border-surface-light">
                <span className="text-slate-400">Live Speed: </span>
                <span className="text-accent-cyan font-bold">{liveTps} TPS</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-surface-light">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-cyan transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>

          {/* Streaming Text Preview */}
          <div className="bg-background rounded-lg p-3 border border-surface-light font-mono text-xs text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
            {liveStreamText || 'Waiting for initial token response...'}
          </div>
        </div>
      )}

      {/* Summary Scorecards (If results exist) */}
      {latestRun && latestRun.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-surface p-4 rounded-xl border border-surface-light shadow-md space-y-1">
            <span className="text-xs text-slate-400 uppercase font-mono">Overall Score</span>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white">{latestRun.summary.scorePercent}%</span>
              <span className="text-xs text-slate-400">
                ({latestRun.summary.passedTests}/{latestRun.summary.totalTests} passed)
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-sans">อัตราความถูกต้องของการเลือก Tool & Schema</p>
          </div>

          <div className="bg-surface p-4 rounded-xl border border-surface-light shadow-md space-y-1">
            <span className="text-xs text-slate-400 uppercase font-mono flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-accent-amber" /> Avg Generation TPS
            </span>
            <div className="mt-1">
              <span className="text-2xl font-black text-accent-amber font-mono">
                {latestRun.summary.avgTps} <span className="text-xs text-slate-400 font-sans">tokens/s</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-sans">ความเร็วเฉลี่ยในการสร้าง Token ต่อวินาที</p>
          </div>

          <div className="bg-surface p-4 rounded-xl border border-surface-light shadow-md space-y-1">
            <span className="text-xs text-slate-400 uppercase font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-accent-cyan" /> Avg TTFT Latency
            </span>
            <div className="mt-1">
              <span className="text-2xl font-black text-accent-cyan font-mono">
                {latestRun.summary.avgTtftMs} <span className="text-xs text-slate-400 font-sans">ms</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-sans">ความหน่วงเวลาตอบรับ Token แรก (มิลลิวินาที)</p>
          </div>

          <div className="bg-surface p-4 rounded-xl border border-surface-light shadow-md space-y-1">
            <span className="text-xs text-slate-400 uppercase font-mono flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-accent-emerald" /> Tool Categories
            </span>
            <div className="mt-1">
              <span className="text-2xl font-black text-accent-emerald font-mono">
                {Object.keys(latestRun.summary.categoryScores).length} <span className="text-xs text-slate-400 font-sans">evaluated</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-sans">หมวดหมู่ทดสอบความสามารถด้าน Tool ที่ผ่านการประเมิน</p>
          </div>
        </div>
      )}

      {/* Main Results Table & Inspector */}
      {latestRun && latestRun.results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Test Results List */}
          <div className="lg:col-span-5 bg-surface rounded-xl border border-surface-light overflow-hidden shadow-lg flex flex-col">
            <div className="p-3.5 bg-surface-light border-b border-surface-lighter flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Executed Tests ({latestRun.results.length})</h3>
              <span className="text-[11px] text-slate-400 font-mono">Click to inspect</span>
            </div>
            <div className="divide-y divide-surface-light max-h-[500px] overflow-y-auto">
              {latestRun.results.map((res) => {
                const isSelected = selectedResult?.testId === res.testId
                return (
                  <div
                    key={res.testId}
                    onClick={() => setSelectedResult(res)}
                    className={`p-3.5 cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-primary-600/15 border-l-4 border-primary-500' : 'hover:bg-surface-light/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {res.passed ? (
                        <CheckCircle className="w-4 h-4 text-accent-emerald flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-accent-rose flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-200 truncate">{res.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span>{res.category}</span>
                          <span>•</span>
                          <span className="text-accent-amber">{res.generationTps} TPS</span>
                          <span>•</span>
                          <span>{res.ttftMs}ms TTFT</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Detailed Test Inspector */}
          <div className="lg:col-span-7 bg-surface rounded-xl border border-surface-light p-5 shadow-lg space-y-4">
            {selectedResult ? (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-surface-light pb-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-slate-400">{selectedResult.category}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{selectedResult.name}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                    selectedResult.passed ? 'bg-accent-emerald/20 text-accent-emerald' : 'bg-accent-rose/20 text-accent-rose'
                  }`}>
                    {selectedResult.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>

                {/* Quick Performance Stats */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                  <div className="bg-background p-2 rounded-lg border border-surface-light">
                    <div className="text-[10px] text-slate-400">TPS</div>
                    <div className="font-bold text-accent-amber">{selectedResult.generationTps}</div>
                  </div>
                  <div className="bg-background p-2 rounded-lg border border-surface-light">
                    <div className="text-[10px] text-slate-400">TTFT</div>
                    <div className="font-bold text-accent-cyan">{selectedResult.ttftMs} ms</div>
                  </div>
                  <div className="bg-background p-2 rounded-lg border border-surface-light">
                    <div className="text-[10px] text-slate-400">Total Tokens</div>
                    <div className="font-bold text-slate-200">{selectedResult.completionTokens}</div>
                  </div>
                  <div className="bg-background p-2 rounded-lg border border-surface-light">
                    <div className="text-[10px] text-slate-400">Duration</div>
                    <div className="font-bold text-slate-200">{(selectedResult.totalDurationMs / 1000).toFixed(2)}s</div>
                  </div>
                </div>

                {/* Validation Errors if any */}
                {selectedResult.evalErrors.length > 0 && (
                  <div className="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-3 text-xs text-rose-300 space-y-1 font-mono">
                    <div className="font-bold flex items-center gap-1.5 text-accent-rose">
                      <AlertTriangle className="w-3.5 h-3.5" /> Validation Issues:
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {selectedResult.evalErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prompt */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase font-mono block mb-1">Prompt Sent</label>
                  <div className="bg-background p-2.5 rounded-lg border border-surface-light text-xs text-slate-300 font-mono whitespace-pre-wrap">
                    {selectedResult.rawPrompt}
                  </div>
                </div>

                {/* Tool Calls Captured */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase font-mono block mb-1">
                    Tool Calls Triggered ({selectedResult.toolCallsMade.length})
                  </label>
                  {selectedResult.toolCallsMade.length > 0 ? (
                    <div className="bg-background p-2.5 rounded-lg border border-surface-light text-xs text-accent-emerald font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {JSON.stringify(selectedResult.toolCallsMade, null, 2)}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic bg-background p-2.5 rounded-lg border border-surface-light">
                      No tool calls produced by the model.
                    </div>
                  )}
                </div>

                {/* Executed Tool Results (Sent Back to Model) */}
                {selectedResult.toolExecutionResults && selectedResult.toolExecutionResults.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-accent-cyan uppercase font-mono block mb-1">
                      🛠️ Executed Tool Output (Returned to Model)
                    </label>
                    <div className="bg-background p-2.5 rounded-lg border border-accent-cyan/30 text-xs text-cyan-300 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {JSON.stringify(selectedResult.toolExecutionResults, null, 2)}
                    </div>
                  </div>
                )}

                {/* Output After Tools (Final Model Synthesis) */}
                {selectedResult.outputAfterTools && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-accent-emerald uppercase font-mono block">
                        💬 Output After Tools (Final Model Synthesis)
                      </label>
                      {selectedResult.secondTurnTps && (
                        <span className="text-[10px] font-mono text-accent-amber bg-surface-light px-2 py-0.5 rounded border border-surface-lighter">
                          Synthesis Speed: {selectedResult.secondTurnTps} TPS
                        </span>
                      )}
                    </div>
                    <div className="bg-accent-emerald/5 p-3 rounded-lg border border-accent-emerald/30 text-xs text-slate-200 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto shadow-inner">
                      {selectedResult.outputAfterTools}
                    </div>
                  </div>
                )}

                {/* Raw Completion Text (If no tool output or direct answer) */}
                {!selectedResult.outputAfterTools && selectedResult.rawResponse && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase font-mono block mb-1">Response Output Text</label>
                    <div className="bg-background p-2.5 rounded-lg border border-surface-light text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {selectedResult.rawResponse}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2">
                <FileText className="w-8 h-8 stroke-1" />
                <span className="text-xs font-mono">Select a test from the left to view detailed logs and JSON parameters.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

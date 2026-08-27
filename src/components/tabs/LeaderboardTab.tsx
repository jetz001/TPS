import React, { useState, useEffect } from 'react'
import { Trophy, Download, Trash2, Zap, Clock, ShieldCheck, FileSpreadsheet } from 'lucide-react'
import { BenchmarkRun } from '../../types'

interface LeaderboardTabProps {
  latestRun: BenchmarkRun | null
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ latestRun }) => {
  const [history, setHistory] = useState<BenchmarkRun[]>([])

  const loadHistory = async () => {
    if (window.electronAPI?.getHistory) {
      try {
        const data = await window.electronAPI.getHistory()
        setHistory(data || [])
      } catch (err) {
        console.error('Failed to load history:', err)
      }
    }
  }

  useEffect(() => {
    loadHistory()
  }, [latestRun])

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all benchmark history?')) {
      if (window.electronAPI?.clearHistory) {
        await window.electronAPI.clearHistory()
        setHistory([])
      }
    }
  }

  const handleExportMarkdown = () => {
    if (history.length === 0) return

    let md = `# 🏆 Local AI Model Benchmark Leaderboard\n\n`
    md += `*Generated on ${new Date().toLocaleString()}*\n\n`
    md += `| Model | Endpoint | Tool Score (%) | Avg TPS | Avg TTFT (ms) | Total Tests | Timestamp |\n`
    md += `|---|---|---|---|---|---|---|\n`

    for (const run of history) {
      md += `| **${run.model}** | \`${run.endpoint}\` | **${run.summary.scorePercent}%** | ${run.summary.avgTps} | ${run.summary.avgTtftMs}ms | ${run.summary.totalTests} | ${new Date(run.timestamp).toLocaleTimeString()} |\n`
    }

    md += `\n\n## Detailed Runs Summary\n`
    for (const run of history) {
      md += `\n### Model: ${run.model} (${new Date(run.timestamp).toLocaleString()})\n`
      md += `- **Avg TPS:** ${run.summary.avgTps} tokens/sec\n`
      md += `- **Avg TTFT:** ${run.summary.avgTtftMs} ms\n`
      md += `- **Tool Calling Accuracy:** ${run.summary.scorePercent}%\n\n`
      md += `| Test ID | Category | Status | TPS | TTFT |\n`
      md += `|---|---|---|---|---|\n`
      for (const res of run.results) {
        md += `| ${res.testId} | ${res.category} | ${res.passed ? '✅ PASS' : '❌ FAIL'} | ${res.generationTps} | ${res.ttftMs}ms |\n`
      }
    }

    // Trigger download in browser/electron
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `local_ai_benchmark_report_${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportJson = () => {
    if (history.length === 0) return
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `local_ai_benchmark_data_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-surface rounded-xl p-6 border border-surface-light shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Model Comparison Leaderboard</h2>
            <span className="text-xs font-mono bg-surface-light text-accent-amber px-2 py-0.5 rounded border border-surface-lighter">
              {history.length} Runs Recorded
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Compare throughput (TPS), latency (TTFT), and 5-dimension tool calling accuracy across all tested local models.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportMarkdown}
            disabled={history.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-surface-light hover:bg-surface-lighter border border-surface-lighter text-slate-200 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Export Markdown</span>
          </button>

          <button
            onClick={handleExportJson}
            disabled={history.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-surface-light hover:bg-surface-lighter border border-surface-lighter text-slate-200 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-accent-emerald" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleClearHistory}
            disabled={history.length === 0}
            className="p-2.5 bg-surface-light hover:bg-accent-rose/20 text-slate-400 hover:text-accent-rose border border-surface-lighter rounded-xl text-xs transition-all disabled:opacity-50"
            title="Clear All History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-surface rounded-xl border border-surface-light overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-light text-slate-400 font-mono uppercase text-[11px] border-b border-surface-lighter">
            <tr>
              <th className="p-4">Rank</th>
              <th className="p-4">Model Name</th>
              <th className="p-4">Endpoint</th>
              <th className="p-4 text-center">Tool Score</th>
              <th className="p-4 text-right">Avg TPS</th>
              <th className="p-4 text-right">Avg TTFT</th>
              <th className="p-4 text-right">Date & Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-light font-mono">
            {history.length > 0 ? (
              history.map((run, idx) => {
                return (
                  <tr key={run.id} className="hover:bg-surface-light/30 transition-colors">
                    <td className="p-4 font-bold text-slate-400">
                      {idx === 0 ? (
                        <span className="flex items-center text-accent-amber gap-1">
                          <Trophy className="w-4 h-4" /> #1
                        </span>
                      ) : (
                        `#${idx + 1}`
                      )}
                    </td>
                    <td className="p-4 font-bold text-white font-sans text-sm">
                      {run.model}
                    </td>
                    <td className="p-4 text-slate-400 text-[11px]">
                      {run.endpoint}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        run.summary.scorePercent >= 80 
                          ? 'bg-accent-emerald/20 text-accent-emerald' 
                          : run.summary.scorePercent >= 50
                          ? 'bg-accent-amber/20 text-accent-amber'
                          : 'bg-accent-rose/20 text-accent-rose'
                      }`}>
                        {run.summary.scorePercent}% ({run.summary.passedTests}/{run.summary.totalTests})
                      </span>
                    </td>
                    <td className="p-4 text-right text-accent-amber font-bold text-sm">
                      {run.summary.avgTps} <span className="text-[10px] text-slate-400 font-normal">t/s</span>
                    </td>
                    <td className="p-4 text-right text-accent-cyan font-bold text-sm">
                      {run.summary.avgTtftMs} <span className="text-[10px] text-slate-400 font-normal">ms</span>
                    </td>
                    <td className="p-4 text-right text-slate-400 text-[11px] font-sans">
                      {new Date(run.timestamp).toLocaleString()}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                  No benchmark runs recorded yet. Start a benchmark to populate the leaderboard.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

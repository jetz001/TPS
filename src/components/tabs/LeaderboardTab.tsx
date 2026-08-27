import React, { useState, useEffect } from 'react'
import { Trophy, Download, Trash2, Zap, Clock, ShieldCheck, FileSpreadsheet, Globe, Laptop, ArrowUpDown, ArrowUp, ArrowDown, Award, Medal } from 'lucide-react'
import { BenchmarkRun, ProviderType } from '../../types'

interface LeaderboardTabProps {
  latestRun: BenchmarkRun | null
}

type SortField = 'rank' | 'score' | 'tps' | 'ttft' | 'date'
type SortOrder = 'asc' | 'desc'

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ latestRun }) => {
  const [history, setHistory] = useState<BenchmarkRun[]>([])
  const [filterType, setFilterType] = useState<'all' | ProviderType>('all')
  const [sortField, setSortField] = useState<SortField>('rank')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder(field === 'ttft' ? 'asc' : 'desc')
    }
  }

  // Filter runs
  const filtered = history.filter(run => {
    if (filterType === 'all') return true
    const isCloud = run.providerType === 'cloud' || (!run.endpoint.includes('localhost') && !run.endpoint.includes('127.0.0.1'))
    return filterType === 'cloud' ? isCloud : !isCloud
  })

  // Sort runs
  const sortedHistory = [...filtered].sort((a, b) => {
    if (sortField === 'rank' || sortField === 'score') {
      // Primary: Score %, Secondary: TPS, Tertiary: TTFT
      if (a.summary.scorePercent !== b.summary.scorePercent) {
        return sortOrder === 'desc' 
          ? b.summary.scorePercent - a.summary.scorePercent
          : a.summary.scorePercent - b.summary.scorePercent
      }
      if (a.summary.avgTps !== b.summary.avgTps) {
        return b.summary.avgTps - a.summary.avgTps
      }
      return a.summary.avgTtftMs - b.summary.avgTtftMs
    }

    if (sortField === 'tps') {
      return sortOrder === 'desc' 
        ? b.summary.avgTps - a.summary.avgTps 
        : a.summary.avgTps - b.summary.avgTps
    }

    if (sortField === 'ttft') {
      return sortOrder === 'asc' 
        ? a.summary.avgTtftMs - b.summary.avgTtftMs 
        : b.summary.avgTtftMs - a.summary.avgTtftMs
    }

    if (sortField === 'date') {
      const dateA = new Date(a.timestamp).getTime()
      const dateB = new Date(b.timestamp).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    }

    return 0
  })

  const handleExportMarkdown = () => {
    if (sortedHistory.length === 0) return

    let md = `# 🏆 Universal AI Model Benchmark Leaderboard\n\n`
    md += `*Generated on ${new Date().toLocaleString()}*\n\n`
    md += `| Rank | Model | Type | Provider | Tool Score (%) | Avg TPS | Avg TTFT (ms) | Total Tests | Date |\n`
    md += `|---|---|---|---|---|---|---|---|---|\n`

    sortedHistory.forEach((run, idx) => {
      const isCloud = run.providerType === 'cloud' || (!run.endpoint.includes('localhost') && !run.endpoint.includes('127.0.0.1'))
      const pType = isCloud ? 'Cloud ☁️' : 'Local 💻'
      const pName = run.providerName || (isCloud ? 'Cloud' : 'Local')
      md += `| #${idx + 1} | **${run.model}** | ${pType} | ${pName} | **${run.summary.scorePercent}%** | ${run.summary.avgTps} | ${run.summary.avgTtftMs}ms | ${run.summary.totalTests} | ${new Date(run.timestamp).toLocaleString()} |\n`
    })

    md += `\n\n## Detailed Runs Summary\n`
    for (const run of sortedHistory) {
      md += `\n### Model: ${run.model} (${new Date(run.timestamp).toLocaleString()})\n`
      md += `- **Provider:** ${run.providerName || (run.providerType === 'cloud' ? 'Cloud' : 'Local')} (\`${run.endpoint}\`)\n`
      md += `- **Avg TPS:** ${run.summary.avgTps} tokens/sec\n`
      md += `- **Avg TTFT:** ${run.summary.avgTtftMs} ms\n`
      md += `- **Tool Calling Accuracy:** ${run.summary.scorePercent}%\n\n`
      md += `| Test ID | Category | Status | TPS | TTFT |\n`
      md += `|---|---|---|---|---|\n`
      for (const res of run.results) {
        md += `| ${res.testId} | ${res.category} | ${res.passed ? '✅ PASS' : '❌ FAIL'} | ${res.generationTps} | ${res.ttftMs}ms |\n`
      }
    }

    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai_benchmark_leaderboard_${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportJson = () => {
    if (sortedHistory.length === 0) return
    const blob = new Blob([JSON.stringify(sortedHistory, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai_benchmark_data_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40 inline-block ml-1" />
    return sortOrder === 'desc' 
      ? <ArrowDown className="w-3 h-3 text-accent-cyan inline-block ml-1 font-bold" />
      : <ArrowUp className="w-3 h-3 text-accent-cyan inline-block ml-1 font-bold" />
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-surface rounded-xl p-6 border border-surface-light shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight">🏆 Model Comparison Leaderboard</h2>
            <span className="text-xs font-mono bg-surface-light text-accent-amber px-2 py-0.5 rounded border border-surface-lighter">
              {history.length} Runs Total
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            จัดอันดับโมเดลตามความแม่นยำของ Tool Calling (%) และความเร็ว TPS จริง (คลิกที่หัวตารางเพื่อเปลี่ยนการจัดเรียงได้)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Local vs Cloud Filter Buttons */}
          <div className="flex bg-surface-light p-1 rounded-xl border border-surface-lighter text-xs font-mono">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-primary-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Models ({history.length})
            </button>
            <button
              onClick={() => setFilterType('local')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'local'
                  ? 'bg-primary-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Local Only</span>
            </button>
            <button
              onClick={() => setFilterType('cloud')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'cloud'
                  ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Cloud Only</span>
            </button>
          </div>

          <button
            onClick={handleExportMarkdown}
            disabled={sortedHistory.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-surface-light hover:bg-surface-lighter border border-surface-lighter text-slate-200 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 font-mono"
          >
            <Download className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Markdown</span>
          </button>

          <button
            onClick={handleExportJson}
            disabled={sortedHistory.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-surface-light hover:bg-surface-lighter border border-surface-lighter text-slate-200 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 font-mono"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-accent-emerald" />
            <span>JSON</span>
          </button>

          <button
            onClick={handleClearHistory}
            disabled={history.length === 0}
            className="p-2 bg-surface-light hover:bg-accent-rose/20 text-slate-400 hover:text-accent-rose border border-surface-lighter rounded-xl text-xs transition-all disabled:opacity-50"
            title="Clear All History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-surface rounded-xl border border-surface-light overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-light text-slate-400 font-mono uppercase text-[11px] border-b border-surface-lighter select-none">
            <tr>
              <th 
                onClick={() => handleSort('rank')}
                className="p-4 cursor-pointer hover:text-white transition-colors"
                title="Sort by Rank / Overall Performance"
              >
                Rank {renderSortIcon('rank')}
              </th>
              <th className="p-4">Model Name</th>
              <th className="p-4">Type & Provider</th>
              <th 
                onClick={() => handleSort('score')}
                className="p-4 text-center cursor-pointer hover:text-white transition-colors"
                title="Sort by Tool Score (%)"
              >
                Tool Score {renderSortIcon('score')}
              </th>
              <th 
                onClick={() => handleSort('tps')}
                className="p-4 text-right cursor-pointer hover:text-white transition-colors"
                title="Sort by Generation TPS"
              >
                Avg TPS {renderSortIcon('tps')}
              </th>
              <th 
                onClick={() => handleSort('ttft')}
                className="p-4 text-right cursor-pointer hover:text-white transition-colors"
                title="Sort by TTFT Latency"
              >
                Avg TTFT {renderSortIcon('ttft')}
              </th>
              <th 
                onClick={() => handleSort('date')}
                className="p-4 text-right cursor-pointer hover:text-white transition-colors"
                title="Sort by Date"
              >
                Date & Time {renderSortIcon('date')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-light font-mono">
            {sortedHistory.length > 0 ? (
              sortedHistory.map((run, idx) => {
                const isCloud = run.providerType === 'cloud' || (!run.endpoint.includes('localhost') && !run.endpoint.includes('127.0.0.1'))
                const providerName = run.providerName || (isCloud ? (run.endpoint.includes('openrouter') ? 'OpenRouter' : run.endpoint.includes('deepseek') ? 'DeepSeek' : run.endpoint.includes('groq') ? 'Groq' : run.endpoint.includes('mistral') ? 'Mistral AI' : 'Cloud') : 'Local')

                return (
                  <tr key={run.id} className="hover:bg-surface-light/30 transition-colors">
                    <td className="p-4 font-bold">
                      {idx === 0 ? (
                        <span className="flex items-center text-amber-400 gap-1 font-black bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/30 w-fit">
                          <Trophy className="w-4 h-4 text-amber-400" /> #1
                        </span>
                      ) : idx === 1 ? (
                        <span className="flex items-center text-slate-200 gap-1 font-bold bg-slate-300/10 px-2 py-0.5 rounded-lg border border-slate-300/30 w-fit">
                          <Award className="w-4 h-4 text-slate-300" /> #2
                        </span>
                      ) : idx === 2 ? (
                        <span className="flex items-center text-amber-600 gap-1 font-bold bg-amber-700/10 px-2 py-0.5 rounded-lg border border-amber-600/30 w-fit">
                          <Medal className="w-4 h-4 text-amber-600" /> #3
                        </span>
                      ) : (
                        <span className="text-slate-400 pl-1.5 font-semibold">#{idx + 1}</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-white font-sans text-sm">
                      {run.model}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono border ${
                        isCloud
                          ? 'bg-accent-cyan/10 text-cyan-300 border-accent-cyan/30'
                          : 'bg-primary-600/10 text-primary-300 border-primary-500/30'
                      }`}>
                        {isCloud ? <Globe className="w-3 h-3 text-accent-cyan" /> : <Laptop className="w-3 h-3 text-primary-400" />}
                        <span>{providerName}</span>
                      </span>
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
                  No benchmark runs found matching filter. Run a benchmark to populate the leaderboard.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

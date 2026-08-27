import React from 'react'
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts'
import { ShieldCheck, CheckCircle, XCircle, Sparkles, Brain, Award } from 'lucide-react'
import { BenchmarkRun, TestCategory } from '../../types'

interface ToolAnalysisTabProps {
  latestRun: BenchmarkRun | null
}

const CATEGORY_NAMES: Record<TestCategory, string> = {
  tps_speed: 'Raw Generation Speed',
  single_tool: 'Single Tool Selection',
  multi_tool_routing: 'Multi-Tool Routing',
  parallel_tool: 'Parallel Tool Calls',
  schema_strictness: 'JSON Schema Strictness',
  tool_restraint: 'Tool Restraint (Negative)',
  context_curve: 'Context Scaling'
}

export const ToolAnalysisTab: React.FC<ToolAnalysisTabProps> = ({ latestRun }) => {
  if (!latestRun || latestRun.results.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 max-w-xl mx-auto space-y-3">
        <Brain className="w-12 h-12 mx-auto stroke-1 text-slate-600" />
        <h3 className="text-base font-semibold text-slate-300">No Tool Benchmark Data Available</h3>
        <p className="text-xs font-mono">
          Run the benchmark suite in the "Benchmark" tab first to generate the 5-dimension intelligence radar chart and tool capability analysis.
        </p>
      </div>
    )
  }

  // Build Radar Data from 5 core tool dimensions
  const toolDims: TestCategory[] = [
    'single_tool',
    'multi_tool_routing',
    'parallel_tool',
    'schema_strictness',
    'tool_restraint'
  ]

  const radarData = toolDims.map(cat => {
    const scoreObj = latestRun.summary.categoryScores[cat]
    return {
      dimension: CATEGORY_NAMES[cat] || cat,
      score: scoreObj ? scoreObj.percent : 0,
      total: scoreObj ? scoreObj.total : 0,
      passed: scoreObj ? scoreObj.passed : 0
    }
  })

  // Overall Tool Capability Level
  const avgToolScore = Math.round(radarData.reduce((sum, d) => sum + d.score, 0) / radarData.length)
  let tierLabel = 'Basic Tool Follower'
  let tierColor = 'text-accent-amber'
  if (avgToolScore >= 90) {
    tierLabel = 'Agent Ready (Elite S-Tier)'
    tierColor = 'text-accent-emerald'
  } else if (avgToolScore >= 75) {
    tierLabel = 'Reliable Tool User (A-Tier)'
    tierColor = 'text-accent-cyan'
  } else if (avgToolScore < 50) {
    tierLabel = 'Experimental / High Hallucination Risk'
    tierColor = 'text-accent-rose'
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-surface rounded-xl p-6 border border-surface-light shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight">5-Dimension Tool Calling Capability Analysis</h2>
            <span className="text-xs font-mono bg-surface-light text-accent-emerald px-2 py-0.5 rounded border border-surface-lighter">
              {latestRun.model}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Quantifies reliability across function selection, parameter schema adherence, parallel dispatch, and hallucination restraint.
          </p>
        </div>

        <div className="bg-background px-4 py-2.5 rounded-xl border border-surface-light flex items-center space-x-3">
          <Award className={`w-6 h-6 ${tierColor}`} />
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-400">Tool Intelligence Rating</div>
            <div className={`text-sm font-black ${tierColor}`}>{tierLabel} ({avgToolScore}%)</div>
          </div>
        </div>
      </div>

      {/* Radar Chart & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Chart Visualizer */}
        <div className="lg:col-span-6 bg-surface p-6 rounded-xl border border-surface-light shadow-lg flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-white uppercase font-mono mb-2 flex items-center gap-2 self-start">
            <Sparkles className="w-4 h-4 text-accent-cyan" /> Tool Intelligence Radar
          </h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="dimension" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                <Radar name={latestRun.model} dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Score Cards */}
        <div className="lg:col-span-6 space-y-3 flex flex-col justify-center">
          {radarData.map(d => (
            <div key={d.dimension} className="bg-surface p-4 rounded-xl border border-surface-light flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-200">{d.dimension}</div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {d.passed} of {d.total} test cases passed
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-24 bg-background h-2 rounded-full overflow-hidden border border-surface-light">
                  <div
                    className={`h-full transition-all duration-500 ${
                      d.score >= 80 ? 'bg-accent-emerald' : d.score >= 50 ? 'bg-accent-amber' : 'bg-accent-rose'
                    }`}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
                <span className="text-sm font-black font-mono text-white w-10 text-right">
                  {d.score}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

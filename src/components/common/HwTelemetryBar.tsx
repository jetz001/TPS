import React, { useEffect, useState } from 'react'
import { Cpu, HardDrive } from 'lucide-react'
import { HwTelemetry } from '../../types'

export const HwTelemetryBar: React.FC = () => {
  const [telemetry, setTelemetry] = useState<HwTelemetry | null>(null)

  useEffect(() => {
    const fetchHw = async () => {
      if (window.electronAPI?.getHwTelemetry) {
        try {
          const data = await window.electronAPI.getHwTelemetry()
          setTelemetry(data)
        } catch {
          // ignore
        }
      }
    }

    fetchHw()
    const timer = setInterval(fetchHw, 2500)
    return () => clearInterval(timer)
  }, [])

  if (!telemetry) return null

  return (
    <div className="flex items-center space-x-4 px-3 py-1 bg-surface rounded-lg border border-surface-light text-xs font-mono">
      {/* CPU */}
      <div className="flex items-center space-x-1.5">
        <Cpu className="w-3.5 h-3.5 text-accent-cyan" />
        <span className="text-slate-400">CPU:</span>
        <span className="text-slate-200 font-semibold">{telemetry.cpuUsagePercent}%</span>
        <div className="w-12 h-1.5 bg-surface-lighter rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent-cyan transition-all duration-500" 
            style={{ width: `${Math.min(telemetry.cpuUsagePercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="w-px h-3 bg-surface-light" />

      {/* RAM */}
      <div className="flex items-center space-x-1.5">
        <HardDrive className="w-3.5 h-3.5 text-accent-emerald" />
        <span className="text-slate-400">RAM:</span>
        <span className="text-slate-200 font-semibold">
          {telemetry.usedMemGB} / {telemetry.totalMemGB} GB
        </span>
        <span className="text-slate-400">({telemetry.memUsagePercent}%)</span>
        <div className="w-12 h-1.5 bg-surface-lighter rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              telemetry.memUsagePercent > 85 ? 'bg-accent-rose' : 'bg-accent-emerald'
            }`} 
            style={{ width: `${telemetry.memUsagePercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}

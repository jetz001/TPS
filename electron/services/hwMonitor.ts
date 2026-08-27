import os from 'os'
import { HwTelemetry } from '../../src/types'

let lastCpuUsage = process.cpuUsage()
let lastCpuTime = Date.now()

export function getSystemTelemetry(): HwTelemetry {
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem

  const now = Date.now()
  const timeDiff = (now - lastCpuTime) / 1000
  const cpuDiff = process.cpuUsage(lastCpuUsage)
  lastCpuTime = now
  lastCpuUsage = process.cpuUsage()

  // Calculate CPU percentage
  const totalCpuMs = (cpuDiff.user + cpuDiff.system) / 1000
  const cpuCount = os.cpus().length || 1
  const cpuPercent = Math.min(Math.round((totalCpuMs / (timeDiff * 1000 * cpuCount)) * 100), 100)

  return {
    cpuUsagePercent: cpuPercent >= 0 ? cpuPercent : 0,
    totalMemGB: Number((totalMem / (1024 ** 3)).toFixed(1)),
    usedMemGB: Number((usedMem / (1024 ** 3)).toFixed(1)),
    freeMemGB: Number((freeMem / (1024 ** 3)).toFixed(1)),
    memUsagePercent: Math.round((usedMem / totalMem) * 100)
  }
}

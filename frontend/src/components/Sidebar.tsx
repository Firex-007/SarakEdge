'use client'

import { motion } from 'framer-motion'
import clsx from 'clsx'
import type { SystemStats } from '@/lib/types'

interface SidebarProps {
  stats:       SystemStats
  lastUpdated: Date | null
  loading:     boolean
}

function StatRow({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-text-3 text-xs font-mono uppercase tracking-wider">{label}</span>
      <span className={clsx('text-xs font-mono font-bold tabular-nums', accent ?? 'text-text-1')}>
        {value}
      </span>
    </div>
  )
}

export function Sidebar({ stats, lastUpdated, loading }: SidebarProps) {
  const syncPercent = stats.total > 0
    ? Math.round((stats.buffered / stats.total) * 100)
    : 0

  return (
    <aside className="flex flex-col gap-4 w-full">

      {/* DTN Efficiency Card */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-xl border border-border bg-surface p-5"
      >
        <h3 className="text-text-3 text-[10px] font-mono tracking-widest uppercase mb-4">
          DTN Resilience
        </h3>

        {/* Ring gauge */}
        <div className="flex items-center justify-center mb-5">
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {/* Track */}
              <circle cx="50" cy="50" r="38" fill="none"
                stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              {/* Live arc */}
              <circle cx="50" cy="50" r="38" fill="none"
                stroke="#1affd4" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(100 - syncPercent) * 2.39} 239`}
                className="transition-all duration-700" />
              {/* Buffered arc */}
              <circle cx="50" cy="50" r="38" fill="none"
                stroke="#ffab40" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${syncPercent * 2.39} 239`}
                strokeDashoffset={`${-(100 - syncPercent) * 2.39}`}
                className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-mono text-text-1 tabular-nums leading-none">
                {stats.total}
              </span>
              <span className="text-[10px] text-text-3 font-mono">packets</span>
            </div>
          </div>
        </div>

        <StatRow label="Live"      value={stats.live}     accent="text-live" />
        <StatRow label="Recovered" value={stats.buffered}  accent="text-buf" />
        <StatRow label="Recovery%" value={`${syncPercent}%`}
          accent={syncPercent > 0 ? 'text-buf' : 'text-text-3'} />
        {stats.lastSyncAt && (
          <StatRow label="Last Sync" value={stats.lastSyncAt} />
        )}
      </motion.div>

      {/* Sensor Status */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-xl border border-border bg-surface p-5"
      >
        <h3 className="text-text-3 text-[10px] font-mono tracking-widest uppercase mb-4">
          Active Sensors
        </h3>
        <div className="space-y-3">
          {[
            { id: 'DHT22', desc: 'Temp / Humidity', ok: true },
            { id: 'MPU6050', desc: 'Accelerometer', ok: true },
            { id: 'NETWORK', desc: 'TCP/IP uplink', ok: stats.live > 0 },
          ].map(s => (
            <div key={s.id} className="flex items-center gap-3">
              <motion.div
                animate={{ scale: s.ok ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 2, repeat: Infinity }}
                className={clsx(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  s.ok ? 'bg-live' : 'bg-red-500'
                )}
              />
              <div>
                <div className="text-text-1 text-xs font-mono font-bold">{s.id}</div>
                <div className="text-text-3 text-[10px] font-mono">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Last Updated */}
      <div className="text-center">
        <p className="text-text-3 text-[10px] font-mono">
          {loading ? 'Fetching…' : lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString('en-GB')}`
            : 'No data'}
        </p>
      </div>
    </aside>
  )
}

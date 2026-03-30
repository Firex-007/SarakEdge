'use client'

import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import type { TelemetryRecord } from '@/lib/types'

interface PacketFeedProps {
  records: TelemetryRecord[]
}

function TypeBadge({ type }: { type: 'LIVE' | 'BUFFERED' }) {
  const isLive = type === 'LIVE'
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold',
      'border tracking-widest uppercase',
      isLive
        ? 'text-live border-live/40 bg-live/10'
        : 'text-buf  border-buf/40  bg-buf/10 animate-pulse-buf'
    )}>
      <span className={clsx('w-1 h-1 rounded-full', isLive ? 'bg-live' : 'bg-buf')} />
      {type}
    </span>
  )
}

function shockMag(r: TelemetryRecord) {
  return Math.sqrt(r.shock_x ** 2 + r.shock_y ** 2 + r.shock_z ** 2).toFixed(3)
}

function edgeDelay(r: TelemetryRecord) {
  const delta = r.timestamp_server - r.timestamp_edge
  return delta > 60
    ? `+${(delta / 60).toFixed(1)}m`
    : `+${delta.toFixed(1)}s`
}

export function PacketFeed({ records }: PacketFeedProps) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div>
          <h2 className="text-text-1 font-sans font-semibold text-sm">Packet Feed</h2>
          <p className="text-text-3 text-xs font-mono mt-0.5">
            Newest first · edge delay shown
          </p>
        </div>
        <span className="text-text-3 font-mono text-xs">{records.length} records</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[60px_100px_1fr_1fr_1fr_80px_80px] gap-2
                      px-5 py-2 border-b border-border">
        {['#', 'TYPE', 'TEMP', 'HUMID', 'SHOCK', 'LATENCY', 'TIME'].map(h => (
          <span key={h} className="text-[10px] font-mono text-text-3 tracking-widest uppercase">
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/50 max-h-[380px] overflow-y-auto
                      scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {records.map((r, i) => {
            const isLive = r.packet_type === 'LIVE'
            return (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i < 5 ? i * 0.04 : 0 }}
                className={clsx(
                  'grid grid-cols-[60px_100px_1fr_1fr_1fr_80px_80px] gap-2',
                  'px-5 py-3 text-xs font-mono items-center',
                  'transition-colors duration-200',
                  isLive
                    ? 'hover:bg-live/5'
                    : 'hover:bg-buf/5 bg-buf/[0.02]',
                  !isLive && 'border-l-2 border-l-buf/60'
                )}
              >
                {/* ID */}
                <span className="text-text-3 tabular-nums">#{r.id}</span>

                {/* Type badge */}
                <TypeBadge type={r.packet_type} />

                {/* Temperature */}
                <span className={clsx(
                  'tabular-nums font-bold',
                  isLive ? 'text-live' : 'text-buf'
                )}>
                  {r.temperature.toFixed(1)}<span className="text-text-3 font-normal">°C</span>
                </span>

                {/* Humidity */}
                <span className="text-text-2 tabular-nums">
                  {r.humidity.toFixed(1)}<span className="text-text-3">%</span>
                </span>

                {/* Shock */}
                <span className={clsx(
                  'tabular-nums',
                  parseFloat(shockMag(r)) > 0.5 ? 'text-red-400' : 'text-text-2'
                )}>
                  {shockMag(r)}<span className="text-text-3">g</span>
                </span>

                {/* Edge → Server latency */}
                <span className={clsx(
                  'tabular-nums',
                  isLive ? 'text-text-3' : 'text-buf/80'
                )}>
                  {edgeDelay(r)}
                </span>

                {/* Arrival time */}
                <span className="text-text-3 tabular-nums">
                  {new Date(r.timestamp_server * 1000).toLocaleTimeString('en-GB')}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {records.length === 0 && (
          <div className="py-16 text-center text-text-3 font-mono text-sm">
            Waiting for packets…
          </div>
        )}
      </div>
    </div>
  )
}

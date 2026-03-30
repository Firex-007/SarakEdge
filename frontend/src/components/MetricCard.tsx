'use client'

import { motion } from 'framer-motion'
import clsx from 'clsx'

interface MetricCardProps {
  label:     string
  value:     string | number | null
  unit:      string
  icon:      string
  accent:    'live' | 'buf' | 'neutral'
  sublabel?: string
  index?:    number
}

const accentStyles = {
  live:    'border-live/20 hover:border-live/40 bg-live-glow',
  buf:     'border-buf/20  hover:border-buf/40  bg-buf-glow',
  neutral: 'border-border  hover:border-border   bg-transparent',
}

const accentText = {
  live:    'text-live',
  buf:     'text-buf',
  neutral: 'text-text-1',
}

export function MetricCard({
  label, value, unit, icon, accent, sublabel, index = 0
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        'relative group rounded-xl border p-5 transition-colors duration-300 overflow-hidden',
        accentStyles[accent]
      )}
    >
      {/* Corner accent mark */}
      <div className={clsx(
        'absolute top-0 left-0 w-6 h-6 overflow-hidden',
      )}>
        <div className={clsx(
          'absolute top-0 left-0 w-0 h-0 border-t-[24px] border-r-[24px] border-r-transparent',
          accent === 'live' ? 'border-t-live/30' :
          accent === 'buf'  ? 'border-t-buf/30'  : 'border-t-border'
        )} />
      </div>

      {/* Subtle background glow on hover */}
      <div className={clsx(
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
        'bg-gradient-to-br',
        accent === 'live' ? 'from-live/5 to-transparent' :
        accent === 'buf'  ? 'from-buf/5  to-transparent' : ''
      )} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <span className="text-xl">{icon}</span>
          <span className={clsx(
            'text-[10px] font-mono tracking-widest uppercase',
            accent === 'live' ? 'text-live/60' :
            accent === 'buf'  ? 'text-buf/60'  : 'text-text-3'
          )}>
            {label}
          </span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className={clsx('text-3xl font-bold font-mono tabular-nums leading-none', accentText[accent])}>
            {value ?? '—'}
          </span>
          <span className="text-sm text-text-3 font-mono">{unit}</span>
        </div>

        {sublabel && (
          <p className="mt-2 text-xs text-text-3 font-mono">{sublabel}</p>
        )}
      </div>
    </motion.div>
  )
}

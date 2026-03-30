'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface DTNToastProps {
  count:  number
  at:     Date
  visible: boolean
}

export function DTNToast({ count, at, visible }: DTNToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,   scale: 1 }}
          exit={{    opacity: 0, y: -12,  scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="relative overflow-hidden rounded-xl border border-buf/40 bg-surface-2
                          px-6 py-4 shadow-[0_0_60px_rgba(255,171,64,0.25)] flex items-start gap-4">
            {/* Scan-line shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-buf/10 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            />

            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-10 h-10 rounded-lg bg-buf-glow border border-buf/30
                              flex items-center justify-center text-xl">
                ⚡
              </div>
            </div>

            {/* Text */}
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono font-bold tracking-widest text-buf uppercase">
                  DTN Sync Complete
                </span>
                <span className="text-[10px] font-mono text-text-3 tabular-nums">
                  {at.toLocaleTimeString('en-GB')}
                </span>
              </div>
              <p className="text-text-1 text-sm font-sans">
                <span className="font-bold text-buf">{count}</span> buffered packet{count !== 1 ? 's' : ''} recovered
                &amp; committed to database.
              </p>
              <p className="text-text-2 text-xs mt-0.5 font-mono">
                STORE → CARRY → FORWARD complete.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

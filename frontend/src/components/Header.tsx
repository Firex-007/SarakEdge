'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

interface HeaderProps {
  deviceId:    string
  lastUpdated: Date | null
  error:       string | null
  liveCount:   number
  bufCount:    number
}

export function Header({ deviceId, lastUpdated, error, liveCount, bufCount }: HeaderProps) {
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-GB'))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const isOnline = !error

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-base/80 backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-6 h-14 flex items-center gap-6">

        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="relative w-7 h-7">
            <div className="absolute inset-0 rounded-md bg-live/20 border border-live/40" />
            <div className="absolute inset-[3px] rounded-sm bg-live/30
                            flex items-center justify-center">
              <span className="text-live text-[10px] font-mono font-black">SE</span>
            </div>
          </div>
          <div>
            <div className="text-text-1 font-sans font-semibold text-sm leading-none">
              SarakEdge
            </div>
            <div className="text-text-3 font-mono text-[10px] leading-none mt-0.5 tracking-widest">
              COMMAND NEXUS
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-border flex-shrink-0" />

        {/* Device */}
        <div className="flex items-center gap-1.5">
          <span className="text-text-3 text-xs font-mono">NODE</span>
          <span className="text-live font-mono text-xs font-bold">{deviceId || '—'}</span>
        </div>

        <div className="flex-1" />

        {/* Stats strip */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-live">
            <span className="w-1.5 h-1.5 rounded-full bg-live inline-block" />
            {liveCount} LIVE
          </span>
          <span className="flex items-center gap-1.5 text-buf">
            <span className="w-1.5 h-1.5 rounded-full bg-buf inline-block" />
            {bufCount} RECOVERED
          </span>
        </div>

        <div className="h-5 w-px bg-border flex-shrink-0 hidden md:block" />

        {/* Connectivity */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: isOnline ? [1, 1.25, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity }}
            className={clsx(
              'w-2 h-2 rounded-full',
              isOnline ? 'bg-live shadow-[0_0_8px_currentColor] text-live' : 'bg-red-500'
            )}
          />
          <span className={clsx(
            'text-xs font-mono hidden sm:block',
            isOnline ? 'text-live' : 'text-red-400'
          )}>
            {isOnline ? 'BACKEND ONLINE' : 'BACKEND OFFLINE'}
          </span>
        </div>

        {/* Clock */}
        <div className="hidden lg:block font-mono text-text-3 text-xs tabular-nums">
          {clock}
        </div>
      </div>
    </header>
  )
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchTelemetry, toChartPoints, computeStats } from '@/lib/api'
import type { TelemetryRecord, ChartPoint, SystemStats } from '@/lib/types'

const POLL_INTERVAL = 3000   // ms — how often we hit /telemetry

interface UseTelemetryReturn {
  records:    TelemetryRecord[]
  chartData:  ChartPoint[]
  stats:      SystemStats
  loading:    boolean
  error:      string | null
  lastUpdated: Date | null
  // fired whenever a new batch of BUFFERED packets arrives (for toast)
  dtnEvent:   { count: number; at: Date } | null
}

export function useTelemetry(): UseTelemetryReturn {
  const [records,     setRecords]     = useState<TelemetryRecord[]>([])
  const [chartData,   setChartData]   = useState<ChartPoint[]>([])
  const [stats,       setStats]       = useState<SystemStats>({
    total: 0, live: 0, buffered: 0,
    latestTemp: null, latestHumid: null, latestShock: null, lastSyncAt: null,
  })
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [dtnEvent,    setDtnEvent]    = useState<{ count: number; at: Date } | null>(null)

  // Track buffered IDs we've already alerted on so we don't re-fire each poll
  const knownBufferedIds = useRef<Set<number>>(new Set())

  const poll = useCallback(async () => {
    try {
      const data = await fetchTelemetry(50)
      const newRecords = data.records

      // ── DTN Detection: find BUFFERED packets we haven't seen before ──
      const newBuffered = newRecords.filter(
        r => r.packet_type === 'BUFFERED' && !knownBufferedIds.current.has(r.id)
      )
      if (newBuffered.length > 0) {
        newBuffered.forEach(r => knownBufferedIds.current.add(r.id))
        setDtnEvent({ count: newBuffered.length, at: new Date() })
        // Auto-dismiss after 6s
        setTimeout(() => setDtnEvent(null), 6000)
      }

      setRecords(newRecords)
      setChartData(toChartPoints(newRecords))
      setStats(computeStats(newRecords))
      setLastUpdated(new Date())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    poll()
    const id = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [poll])

  return { records, chartData, stats, loading, error, lastUpdated, dtnEvent }
}

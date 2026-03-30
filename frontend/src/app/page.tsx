'use client'

import { useTelemetry } from '@/hooks/useTelemetry'
import { Header }         from '@/components/Header'
import { MetricCard }     from '@/components/MetricCard'
import { TelemetryChart } from '@/components/TelemetryChart'
import { PacketFeed }     from '@/components/PacketFeed'
import { Sidebar }        from '@/components/Sidebar'
import { DTNToast }       from '@/components/DTNToast'

export default function DashboardPage() {
  const {
    records,
    chartData,
    stats,
    loading,
    error,
    lastUpdated,
    dtnEvent,
  } = useTelemetry()

  const deviceId = records[0]?.device_id ?? 'NO SIGNAL'

  return (
    <>
      {/* Global DTN Event Toast */}
      <DTNToast
        count={dtnEvent?.count ?? 0}
        at={dtnEvent?.at ?? new Date()}
        visible={!!dtnEvent}
      />

      <div className="min-h-screen flex flex-col">
        <Header
          deviceId={deviceId}
          lastUpdated={lastUpdated}
          error={error}
          liveCount={stats.live}
          bufCount={stats.buffered}
        />

        <main className="flex-1 mx-auto w-full max-w-[1600px] px-4 sm:px-6 py-6">

          {/* Loading skeleton */}
          {loading && records.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3 text-text-3">
                <div className="w-8 h-8 border-2 border-live/30 border-t-live rounded-full animate-spin" />
                <span className="font-mono text-sm">Connecting to backend…</span>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="mb-6 px-5 py-4 rounded-xl border border-red-500/30 bg-red-500/10
                            font-mono text-red-400 text-sm">
              <span className="font-bold">⚠ Backend unreachable</span>
              <span className="text-red-400/70 ml-2">— {error}</span>
              <p className="text-xs mt-1 text-red-400/50">
                Is the FastAPI server running on port 8000?
              </p>
            </div>
          )}

          {/* Main layout: sidebar + content */}
          <div className="flex gap-5 items-start">

            {/* ── Left Sidebar ─────────────────────────────────────────── */}
            <div className="hidden xl:block w-56 flex-shrink-0">
              <Sidebar stats={stats} lastUpdated={lastUpdated} loading={loading} />
            </div>

            {/* ── Main Content ──────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* Metric Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="col-span-2 sm:col-span-1 lg:col-span-2">
                  <MetricCard
                    label="Temperature"
                    value={stats.latestTemp}
                    unit="°C"
                    icon="🌡"
                    accent="live"
                    sublabel="DHT22 sensor"
                    index={0}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 lg:col-span-2">
                  <MetricCard
                    label="Humidity"
                    value={stats.latestHumid}
                    unit="%"
                    icon="💧"
                    accent="neutral"
                    sublabel="DHT22 sensor"
                    index={1}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 lg:col-span-2">
                  <MetricCard
                    label="Shock Mag"
                    value={stats.latestShock}
                    unit="g"
                    icon="⚡"
                    accent={
                      stats.latestShock !== null && stats.latestShock > 0.5
                        ? 'buf'
                        : 'neutral'
                    }
                    sublabel="MPU6050 · √(x²+y²+z²)"
                    index={2}
                  />
                </div>
                <div className="col-span-2 lg:col-span-3">
                  <MetricCard
                    label="Live Packets"
                    value={stats.live}
                    unit="pkts"
                    icon="📡"
                    accent="live"
                    sublabel="Sent in real-time"
                    index={3}
                  />
                </div>
                <div className="col-span-2 lg:col-span-3">
                  <MetricCard
                    label="DTN Recovered"
                    value={stats.buffered}
                    unit="pkts"
                    icon="📦"
                    accent={stats.buffered > 0 ? 'buf' : 'neutral'}
                    sublabel={stats.lastSyncAt ? `Last sync ${stats.lastSyncAt}` : 'No outage yet'}
                    index={4}
                  />
                </div>
              </div>

              {/* Telemetry Chart */}
              {chartData.length > 0 && (
                <TelemetryChart data={chartData} />
              )}

              {/* Packet Feed */}
              {records.length > 0 && (
                <PacketFeed records={records} />
              )}

              {/* Empty state */}
              {!loading && records.length === 0 && !error && (
                <div className="rounded-xl border border-border bg-surface p-16 text-center">
                  <p className="text-4xl mb-4">📡</p>
                  <p className="text-text-1 font-sans font-semibold mb-2">No packets yet</p>
                  <p className="text-text-3 font-mono text-sm">
                    Start <code className="text-live">edge/simulator.py</code> to begin sending telemetry.
                  </p>
                </div>
              )}
            </div>

            {/* ── Right: Mobile Sidebar ───────────────────────────────── */}
            <div className="hidden lg:block xl:hidden w-48 flex-shrink-0">
              <Sidebar stats={stats} lastUpdated={lastUpdated} loading={loading} />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border mt-8 py-4">
          <div className="mx-auto max-w-[1600px] px-6 flex items-center justify-between
                          text-text-3 text-[11px] font-mono">
            <span>SarakEdge · HackHustle 2026</span>
            <span>Store → Carry → Forward</span>
          </div>
        </footer>
      </div>
    </>
  )
}

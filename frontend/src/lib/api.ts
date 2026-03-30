import type { TelemetryResponse, ChartPoint, SystemStats } from './types'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:8000'

// ─── Raw fetch ────────────────────────────────────────────────────────────────

export async function fetchTelemetry(limit = 50): Promise<TelemetryResponse> {
  const res = await fetch(`${BACKEND}/telemetry?limit=${limit}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Backend returned ${res.status}`)
  return res.json()
}

// ─── Derived data helpers ─────────────────────────────────────────────────────

export function toChartPoints(records: TelemetryResponse['records']): ChartPoint[] {
  return [...records]
    .reverse()                              // oldest → newest for chart
    .map(r => ({
      time:        new Date(r.timestamp_server * 1000).toLocaleTimeString('en-GB'),
      temperature: parseFloat(r.temperature.toFixed(1)),
      humidity:    parseFloat(r.humidity.toFixed(1)),
      shock_mag:   parseFloat(
        Math.sqrt(r.shock_x ** 2 + r.shock_y ** 2 + r.shock_z ** 2).toFixed(3)
      ),
      type:        r.packet_type,
    }))
}

export function computeStats(records: TelemetryResponse['records']): SystemStats {
  const live     = records.filter(r => r.packet_type === 'LIVE')
  const buffered = records.filter(r => r.packet_type === 'BUFFERED')
  const latest   = records[0] ?? null

  // Find the most recent BUFFERED batch timestamp
  const lastBuf = buffered[0]
  const lastSyncAt = lastBuf
    ? new Date(lastBuf.timestamp_server * 1000).toLocaleTimeString('en-GB')
    : null

  return {
    total:         records.length,
    live:          live.length,
    buffered:      buffered.length,
    latestTemp:    latest ? parseFloat(latest.temperature.toFixed(1)) : null,
    latestHumid:   latest ? parseFloat(latest.humidity.toFixed(1)) : null,
    latestShock:   latest
      ? parseFloat(
          Math.sqrt(latest.shock_x ** 2 + latest.shock_y ** 2 + latest.shock_z ** 2).toFixed(3)
        )
      : null,
    lastSyncAt,
  }
}

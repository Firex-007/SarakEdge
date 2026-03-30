// ─── Domain Types ─────────────────────────────────────────────────────────────

export type PacketType = 'LIVE' | 'BUFFERED'

export interface TelemetryRecord {
  id:               number
  device_id:        string
  temperature:      number
  humidity:         number
  shock_x:          number
  shock_y:          number
  shock_z:          number
  packet_type:      PacketType
  timestamp_edge:   number   // unix epoch (edge clock)
  timestamp_server: number   // unix epoch (server clock)
}

export interface TelemetryResponse {
  count:   number
  records: TelemetryRecord[]
}

// Derived metric used in charts
export interface ChartPoint {
  time:        string      // HH:MM:SS label
  temperature: number
  humidity:    number
  shock_mag:   number      // √(x²+y²+z²)
  type:        PacketType
}

export interface SystemStats {
  total:     number
  live:      number
  buffered:  number
  latestTemp:    number | null
  latestHumid:   number | null
  latestShock:   number | null
  lastSyncAt:    string | null   // ISO string of last BUFFERED batch
}

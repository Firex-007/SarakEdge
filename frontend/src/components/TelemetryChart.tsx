'use client'

import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { ChartPoint } from '@/lib/types'

interface TelemetryChartProps {
  data: ChartPoint[]
}

// Custom tooltip to match our design system
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const type = payload[0]?.payload?.type
  const isBuf = type === 'BUFFERED'

  return (
    <div className={`rounded-lg border px-3 py-2.5 text-xs font-mono shadow-xl backdrop-blur-sm
      ${isBuf
        ? 'border-buf/40 bg-surface-2/95 shadow-buf/10'
        : 'border-live/30 bg-surface-2/95 shadow-live/5'
      }`}>
      <div className={`text-[10px] tracking-widest mb-2 font-bold ${isBuf ? 'text-buf' : 'text-live'}`}>
        {label} · {isBuf ? '⚡ BUFFERED' : '● LIVE'}
      </div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span className="text-text-3">{p.name}</span>
          <span style={{ color: p.color }} className="font-bold tabular-nums">
            {p.value}
            {p.dataKey === 'temperature' ? '°C' : p.dataKey === 'humidity' ? '%' : 'g'}
          </span>
        </div>
      ))}
    </div>
  )
}

// Custom dot: buffered packets render as amber diamond shape
function CustomDot(props: any) {
  const { cx, cy, payload } = props
  if (!payload || payload.type !== 'BUFFERED') return null
  return (
    <polygon
      key={`${cx}-${cy}`}
      points={`${cx},${cy - 5} ${cx + 4},${cy} ${cx},${cy + 5} ${cx - 4},${cy}`}
      fill="#ffab40"
      stroke="#0d1117"
      strokeWidth={1}
    />
  )
}

export function TelemetryChart({ data }: TelemetryChartProps) {
  // Find time indices where buffered packets start — for reference lines
  const bufferBreaks = data.reduce<string[]>((acc, pt, i) => {
    if (pt.type === 'BUFFERED' && (i === 0 || data[i - 1].type === 'LIVE')) {
      acc.push(pt.time)
    }
    return acc
  }, [])

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-text-1 font-sans font-semibold text-sm">Telemetry Timeline</h2>
          <p className="text-text-3 text-xs font-mono mt-0.5">Last 50 records · 3s refresh</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-live">
            <span className="inline-block w-3 h-0.5 bg-live rounded" />
            Temperature
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="inline-block w-3 h-0.5 bg-sky-400 rounded" />
            Humidity
          </span>
          <span className="flex items-center gap-1.5 text-buf">
            <span className="inline-block w-3 h-0.5 bg-buf rounded border-dashed" />
            Shock Mag
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#1affd4" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#1affd4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#38bdf8" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />

          {/* Mark where buffered batches begin */}
          {bufferBreaks.map(t => (
            <ReferenceLine
              key={t}
              x={t}
              stroke="#ffab40"
              strokeOpacity={0.5}
              strokeDasharray="4 2"
              label={{ value: 'DTN↑', fill: '#ffab40', fontSize: 9, fontFamily: 'monospace' }}
            />
          ))}

          <XAxis
            dataKey="time"
            tick={{ fill: '#445566', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#445566', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="temperature"
            name="Temp"
            stroke="#1affd4"
            strokeWidth={2}
            fill="url(#tempGrad)"
            dot={<CustomDot />}
            activeDot={{ r: 4, fill: '#1affd4', stroke: '#07090e', strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="humidity"
            name="Humidity"
            stroke="#38bdf8"
            strokeWidth={1.5}
            fill="url(#humGrad)"
            dot={false}
            activeDot={{ r: 3, fill: '#38bdf8', stroke: '#07090e', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="shock_mag"
            name="Shock"
            stroke="#ffab40"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 3, fill: '#ffab40', stroke: '#07090e', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

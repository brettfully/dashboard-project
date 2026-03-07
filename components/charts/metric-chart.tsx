"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartDataPoint {
  name: string
  [key: string]: string | number
}

interface MetricLineChartProps {
  title: string
  data: ChartDataPoint[]
  lines: { key: string; color: string; label: string }[]
  valueFormatter?: (value: number) => string
}

export function MetricLineChart({ title, data, lines, valueFormatter }: MetricLineChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={valueFormatter} />
            <Tooltip formatter={(value) => valueFormatter ? valueFormatter(value as number) : value} />
            <Legend />
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.label}
                stroke={line.color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface MetricBarChartProps {
  title: string
  data: ChartDataPoint[]
  bars: { key: string; color: string; label: string }[]
  valueFormatter?: (value: number) => string
}

export function MetricBarChart({ title, data, bars, valueFormatter }: MetricBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={valueFormatter} />
            <Tooltip formatter={(value) => valueFormatter ? valueFormatter(value as number) : value} />
            <Legend />
            {bars.map((bar) => (
              <Bar key={bar.key} dataKey={bar.key} name={bar.label} fill={bar.color} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

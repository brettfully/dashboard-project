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

function formatValue(value: number, format?: "currency" | "number"): string {
  if (format === "currency") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
  }
  return new Intl.NumberFormat("en-US").format(value)
}

interface MetricLineChartProps {
  title: string
  data: ChartDataPoint[]
  lines: { key: string; color: string; label: string }[]
  format?: "currency" | "number"
}

export function MetricLineChart({ title, data, lines, format }: MetricLineChartProps) {
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
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatValue(v, format)} />
            <Tooltip formatter={(value) => formatValue(value as number, format)} />
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
  format?: "currency" | "number"
}

export function MetricBarChart({ title, data, bars, format }: MetricBarChartProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#a3a3a3" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#a3a3a3" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatValue(v, format)}
              width={format === "currency" ? 70 : 40}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{ background: "#2c2c2c", border: "1px solid #404040", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#a3a3a3" }}
              formatter={(value) => formatValue(value as number, format)}
            />
            {bars.map((bar) => (
              <Bar key={bar.key} dataKey={bar.key} name={bar.label} fill={bar.color} radius={[4, 4, 0, 0]} maxBarSize={48} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

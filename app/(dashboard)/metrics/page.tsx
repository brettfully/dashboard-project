import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { MetricsContent } from "./metrics-content"
import { startOfMonth, endOfMonth } from "date-fns"

function applyFormula(
  op: string,
  a: number,
  b: number
): number | null {
  if (op === "add") return a + b
  if (op === "subtract") return a - b
  if (op === "multiply") return a * b
  if (op === "divide") return b !== 0 ? a / b : null
  return null
}

export default async function MetricsPage() {
  const session = await auth()
  const orgId = (session?.user as { organizationId?: string })?.organizationId

  const now = new Date()
  const from = startOfMonth(now)
  const to = endOfMonth(now)

  const [customMetrics, products, dataEntries, customEntries] = await Promise.all([
    db.customMetric.findMany({
      where: { organizationId: orgId },
      include: { updatedBy: true },
      orderBy: { createdAt: "asc" },
    }),
    db.product.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.dataEntry.findMany({
      where: { organizationId: orgId, date: { gte: from, lte: to } },
    }),
    db.customMetricEntry.findMany({
      where: {
        customMetric: { organizationId: orgId },
        date: { gte: from, lte: to },
      },
      select: { customMetricId: true, value: true },
    }),
  ])

  // Sum every numeric DataEntry field across the period
  const deSums: Record<string, number> = {}
  for (const entry of dataEntries) {
    for (const [key, val] of Object.entries(entry)) {
      if (typeof val === "number") {
        deSums[key] = (deSums[key] ?? 0) + val
      }
    }
  }

  // Sum CustomMetricEntry values per metric
  const cmSums: Record<string, number> = {}
  for (const entry of customEntries) {
    cmSums[entry.customMetricId] = (cmSums[entry.customMetricId] ?? 0) + entry.value
  }

  // Compute a value for every custom metric definition
  const metricValues: Record<string, number | null> = {}
  for (const m of customMetrics) {
    if (m.type === "CALCULATED" && m.firstField && m.secondField && m.operator) {
      const a = deSums[m.firstField] ?? 0
      const b = deSums[m.secondField] ?? 0
      metricValues[m.id] = applyFormula(m.operator, a, b)
    } else {
      metricValues[m.id] = cmSums[m.id] ?? 0
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6">
        <h1 className="text-xl font-semibold text-foreground">Metrics</h1>
        <MetricsContent
          metrics={customMetrics}
          products={products}
          metricValues={metricValues}
        />
      </div>
    </div>
  )
}

import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { KpiCard } from "@/components/charts/kpi-card"
import { MetricBarChart } from "@/components/charts/metric-chart"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { formatCurrency, formatNumber, calcROAS } from "@/lib/utils"
import { DollarSign, TrendingUp, Phone, Megaphone, Wallet, BarChart3, Activity } from "lucide-react"
import { subDays, startOfDay, parseISO, differenceInDays, format } from "date-fns"

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; user?: string; product?: string }>
}) {
  const session = await auth()
  const orgId = (session?.user as { organizationId?: string })?.organizationId

  const params = await searchParams
  const toDate   = params.to   ? startOfDay(parseISO(params.to))   : startOfDay(new Date())
  const fromDate = params.from ? startOfDay(parseISO(params.from)) : startOfDay(subDays(new Date(), 30))

  const rangeDays = Math.max(1, differenceInDays(toDate, fromDate))
  const prevTo    = fromDate
  const prevFrom  = startOfDay(subDays(fromDate, rangeDays))

  const baseWhere = {
    organizationId: orgId,
    ...(params.user    ? { userId:    params.user }    : {}),
    ...(params.product ? { productId: params.product } : {}),
  }

  const [currentEntries, previousEntries, allTimeEntries, pinnedMetrics] = await Promise.all([
    db.dataEntry.findMany({
      where: { ...baseWhere, date: { gte: fromDate, lte: toDate } },
      orderBy: { date: "asc" },
    }),
    db.dataEntry.findMany({
      where: { ...baseWhere, date: { gte: prevFrom, lt: prevTo } },
    }),
    db.dataEntry.findMany({
      where: { organizationId: orgId },
      select: { cashCollected: true },
    }),
    db.customMetric.findMany({
      where: { organizationId: orgId, pinnedToOverview: true, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const pinnedIds = pinnedMetrics.map((m) => m.id)
  const customEntries = pinnedIds.length > 0
    ? await db.customMetricEntry.findMany({
        where: {
          customMetricId: { in: pinnedIds },
          date: { gte: fromDate, lte: toDate },
        },
        select: { customMetricId: true, value: true },
      })
    : []

  const sum = (entries: typeof currentEntries, field: keyof (typeof currentEntries)[0]) =>
    entries.reduce((acc, e) => acc + Number(e[field]), 0)

  const newCashCollected  = sum(currentEntries, "cashCollected")
  const totalRevenue      = sum(currentEntries, "revenueGenerated")
  const scheduledCalls    = sum(currentEntries, "scheduledCalls")
  const adSpend           = sum(currentEntries, "adSpend")
  const roas              = calcROAS(newCashCollected, adSpend)

  const totalCashCollected = allTimeEntries.reduce((acc, e) => acc + Number(e.cashCollected), 0)

  const prevCash    = sum(previousEntries, "cashCollected")
  const prevRevenue = sum(previousEntries, "revenueGenerated")
  const prevCalls   = sum(previousEntries, "scheduledCalls")
  const prevAdSpend = sum(previousEntries, "adSpend")
  const prevRoas    = calcROAS(prevRevenue, prevAdSpend)

  const trend = (curr: number, prev: number) =>
    prev > 0 ? ((curr - prev) / prev) * 100 : 0

  // Compute pinned custom metric values for the selected date range
  const deSums: Record<string, number> = {}
  for (const entry of currentEntries) {
    for (const [key, val] of Object.entries(entry)) {
      if (typeof val === "number") deSums[key] = (deSums[key] ?? 0) + val
    }
  }
  const cmSums: Record<string, number> = {}
  for (const e of customEntries) {
    cmSums[e.customMetricId] = (cmSums[e.customMetricId] ?? 0) + e.value
  }

  function computeMetricValue(m: typeof pinnedMetrics[0]): number | null {
    if (m.type === "CALCULATED" && m.firstField && m.secondField && m.operator) {
      const a = deSums[m.firstField] ?? 0
      const b = deSums[m.secondField] ?? 0
      if (m.operator === "add") return a + b
      if (m.operator === "subtract") return a - b
      if (m.operator === "multiply") return a * b
      if (m.operator === "divide") return b !== 0 ? a / b : null
    }
    return cmSums[m.id] ?? 0
  }

  function formatMetricValue(m: typeof pinnedMetrics[0], value: number | null): string {
    if (value === null) return "—"
    const as = m.showResultAs ?? (m.type === "CURRENCY" ? "currency" : "number")
    if (as === "currency")
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
    if (as === "percent") return `${value.toFixed(1)}%`
    return Number.isInteger(value) ? String(value) : value.toFixed(2)
  }

  // Build chart data grouped by day
  const chartMap: Record<string, { calls: number; cash: number }> = {}
  currentEntries.forEach((e) => {
    const day = format(new Date(e.date), "MMM d")
    if (!chartMap[day]) chartMap[day] = { calls: 0, cash: 0 }
    chartMap[day].calls += e.scheduledCalls
    chartMap[day].cash  += e.cashCollected
  })
  const chartData = Object.entries(chartMap).map(([name, vals]) => ({ name, ...vals }))

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6">
        <h1 className="text-[1.5rem] font-semibold text-foreground">Overview</h1>

        <Suspense fallback={<div className="h-9" />}>
          <DashboardFilters />
        </Suspense>

        <div className="pt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <KpiCard
            title="New Cash Collected"
            value={formatCurrency(newCashCollected)}
            trend={trend(newCashCollected, prevCash)}
            icon={Wallet}
            valueColor="green"
          />
          <KpiCard
            title="Total Cash Collected"
            value={formatCurrency(totalCashCollected)}
            icon={DollarSign}
            valueColor="green"
          />
          <KpiCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            trend={trend(totalRevenue, prevRevenue)}
            icon={TrendingUp}
            valueColor="blue"
          />
          <KpiCard
            title="Total Booked Calls"
            value={formatNumber(scheduledCalls)}
            trend={trend(scheduledCalls, prevCalls)}
            icon={Phone}
          />
          <KpiCard
            title="Ad Spend"
            value={formatCurrency(adSpend)}
            trend={trend(adSpend, prevAdSpend)}
            icon={Megaphone}
          />
          <KpiCard
            title="ROAS"
            value={roas > 0 ? roas.toFixed(2) + "x" : "—"}
            trend={trend(roas, prevRoas)}
            icon={BarChart3}
            subtitle={adSpend > 0 ? `on ${formatCurrency(adSpend)} spend` : undefined}
          />
        </div>

        {pinnedMetrics.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {pinnedMetrics.map((m) => (
              <KpiCard
                key={m.id}
                title={m.name}
                value={formatMetricValue(m, computeMetricValue(m))}
                icon={Activity}
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MetricBarChart
            title="Total Calls Booked by Date"
            data={chartData}
            bars={[{ key: "calls", color: "#6366f1", label: "Calls Booked" }]}
            format="number"
          />
          <MetricBarChart
            title="Total Cash Collected by Date"
            data={chartData}
            bars={[{ key: "cash", color: "#22c55e", label: "Cash Collected" }]}
            format="currency"
          />
        </div>
      </div>
    </div>
  )
}

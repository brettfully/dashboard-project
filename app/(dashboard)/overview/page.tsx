import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Header } from "@/components/dashboard/header"
import { KpiCard } from "@/components/charts/kpi-card"
import { MetricLineChart } from "@/components/charts/metric-chart"
import { formatCurrency, formatNumber, calcROAS } from "@/lib/utils"
import { DollarSign, TrendingUp, Phone, Megaphone } from "lucide-react"
import { format, subDays, startOfDay } from "date-fns"

export default async function OverviewPage() {
  const session = await auth()
  const orgId = (session?.user as { organizationId?: string })?.organizationId

  const thirtyDaysAgo = startOfDay(subDays(new Date(), 30))
  const sixtyDaysAgo = startOfDay(subDays(new Date(), 60))

  const [currentEntries, previousEntries, last30DaysEntries] = await Promise.all([
    db.dataEntry.findMany({
      where: { organizationId: orgId, date: { gte: thirtyDaysAgo } },
    }),
    db.dataEntry.findMany({
      where: {
        organizationId: orgId,
        date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    }),
    db.dataEntry.findMany({
      where: { organizationId: orgId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: "asc" },
    }),
  ])

  const sum = (entries: typeof currentEntries, field: keyof typeof currentEntries[0]) =>
    entries.reduce((acc, e) => acc + Number(e[field]), 0)

  const cashCollected = sum(currentEntries, "cashCollected")
  const totalRevenue = sum(currentEntries, "revenueGenerated")
  const scheduledCalls = sum(currentEntries, "scheduledCalls")
  const adSpend = sum(currentEntries, "adSpend")
  const roas = calcROAS(totalRevenue, adSpend)

  const prevCash = sum(previousEntries, "cashCollected")
  const cashTrend = prevCash > 0 ? ((cashCollected - prevCash) / prevCash) * 100 : 0

  // Build chart data by day
  const chartMap: Record<string, { cashCollected: number; revenue: number; adSpend: number }> = {}
  last30DaysEntries.forEach((e) => {
    const day = format(new Date(e.date), "MMM d")
    if (!chartMap[day]) chartMap[day] = { cashCollected: 0, revenue: 0, adSpend: 0 }
    chartMap[day].cashCollected += e.cashCollected
    chartMap[day].revenue += e.revenueGenerated
    chartMap[day].adSpend += e.adSpend
  })
  const chartData = Object.entries(chartMap).map(([name, vals]) => ({ name, ...vals }))

  return (
    <div className="flex flex-col h-full">
      <Header title="Overview" />
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Cash Collected (30d)"
            value={formatCurrency(cashCollected)}
            trend={cashTrend}
            icon={DollarSign}
          />
          <KpiCard
            title="Total Revenue (30d)"
            value={formatCurrency(totalRevenue)}
            icon={TrendingUp}
          />
          <KpiCard
            title="Calls Booked (30d)"
            value={formatNumber(scheduledCalls)}
            icon={Phone}
          />
          <KpiCard
            title="ROAS"
            value={roas.toFixed(2) + "x"}
            subtitle={`Ad Spend: ${formatCurrency(adSpend)}`}
            icon={Megaphone}
          />
        </div>

        <MetricLineChart
          title="Revenue vs Cash Collected (Last 30 Days)"
          data={chartData}
          lines={[
            { key: "revenue", color: "#6366f1", label: "Revenue" },
            { key: "cashCollected", color: "#22c55e", label: "Cash Collected" },
          ]}
          valueFormatter={formatCurrency}
        />
      </div>
    </div>
  )
}

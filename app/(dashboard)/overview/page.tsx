import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { KpiCard } from "@/components/charts/kpi-card"
import { MetricBarChart } from "@/components/charts/metric-chart"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { formatCurrency, formatNumber, calcROAS } from "@/lib/utils"
import { DollarSign, TrendingUp, Phone, Megaphone, Wallet, BarChart3 } from "lucide-react"
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

  const [currentEntries, previousEntries, allTimeEntries] = await Promise.all([
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
  ])

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

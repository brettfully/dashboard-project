import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { KpiCard } from "@/components/charts/kpi-card"
import { MetricBarChart } from "@/components/charts/metric-chart"
import { formatCurrency } from "@/lib/utils"
import { Suspense } from "react"
import { format } from "date-fns"
import { DollarSign, TrendingDown, TrendingUp, PiggyBank, ReceiptText, Megaphone } from "lucide-react"
import { DateRangeFilters } from "@/components/dashboard/date-range-filters"

export default async function FinancialsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const session = await auth()
  const orgId = (session?.user as { organizationId?: string })?.organizationId

  const params = await searchParams
  const toDate   = params.to   ? new Date(params.to   + "T23:59:59.999Z") : new Date()
  const fromDate = params.from ? new Date(params.from + "T00:00:00.000Z") : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const entries = await db.dataEntry.findMany({
    where: { organizationId: orgId, date: { gte: fromDate, lte: toDate } },
    orderBy: { date: "asc" },
  })

  const sum = (field: keyof typeof entries[0]) =>
    entries.reduce((acc, e) => acc + Number(e[field]), 0)

  const cashCollected    = sum("cashCollected")
  const revenue          = sum("revenueGenerated")
  const refunds          = sum("refunds")
  const adSpend          = sum("adSpend")
  const businessExpenses = sum("businessExpenses")
  const netRevenue       = revenue - refunds - adSpend - businessExpenses

  // Chart: group by day
  const chartMap: Record<string, { revenue: number; expenses: number; net: number }> = {}
  entries.forEach((e) => {
    const day = format(new Date(e.date), "MMM d")
    if (!chartMap[day]) chartMap[day] = { revenue: 0, expenses: 0, net: 0 }
    chartMap[day].revenue   += e.revenueGenerated
    chartMap[day].expenses  += e.adSpend + e.businessExpenses
    chartMap[day].net       += e.revenueGenerated - e.refunds - e.adSpend - e.businessExpenses
  })
  const chartData = Object.entries(chartMap).map(([name, vals]) => ({ name, ...vals }))

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6">
        <h1 className="text-xl font-semibold text-foreground">Financials</h1>

        <Suspense fallback={<div className="h-9" />}>
          <DateRangeFilters />
        </Suspense>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard title="Cash Collected"      value={formatCurrency(cashCollected)}    icon={DollarSign} />
          <KpiCard title="Revenue Generated"   value={formatCurrency(revenue)}          icon={TrendingUp} />
          <KpiCard title="Refunds"             value={formatCurrency(refunds)}          icon={ReceiptText} />
          <KpiCard title="Ad Spend"            value={formatCurrency(adSpend)}          icon={Megaphone} />
          <KpiCard title="Business Expenses"   value={formatCurrency(businessExpenses)} icon={TrendingDown} />
          <KpiCard title="Net Revenue"         value={formatCurrency(netRevenue)}       icon={PiggyBank} />
        </div>

        {chartData.length > 0 ? (
          <MetricBarChart
            title="Financial Overview"
            data={chartData}
            bars={[
              { key: "revenue",  color: "#FBBF24", label: "Revenue" },
              { key: "expenses", color: "#ef4444", label: "Expenses" },
              { key: "net",      color: "#f97316", label: "Net Revenue" },
            ]}
            format="currency"
          />
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            No data for the selected period. Add entries in the Data Entry tab.
          </div>
        )}
      </div>
    </div>
  )
}

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { KpiCard } from "@/components/charts/kpi-card"
import { MetricBarChart } from "@/components/charts/metric-chart"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { Suspense } from "react"
import { format } from "date-fns"
import { DollarSign, TrendingDown, TrendingUp, PiggyBank, ReceiptText, Megaphone } from "lucide-react"
import { DateRangeFilters } from "@/components/dashboard/date-range-filters"
import { TaxRateInput } from "@/components/dashboard/tax-rate-input"

export default async function FinancialsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; tax?: string }>
}) {
  const session = await auth()
  const orgId = (session?.user as { organizationId?: string })?.organizationId

  const params = await searchParams
  const toDate   = params.to   ? new Date(params.to   + "T23:59:59.999Z") : new Date()
  const fromDate = params.from ? new Date(params.from + "T00:00:00.000Z") : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const taxRate  = Math.min(99, Math.max(0, parseFloat(params.tax ?? "30") || 30))

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
  const totalExpenses    = adSpend + businessExpenses
  const preTaxProfit     = revenue - refunds - totalExpenses
  const taxAmount        = preTaxProfit > 0 ? preTaxProfit * (taxRate / 100) : 0
  const netAfterTaxes    = preTaxProfit - taxAmount

  // Chart: group by day
  const chartMap: Record<string, { revenue: number; expenses: number; preTaxProfit: number; netAfterTaxes: number }> = {}
  entries.forEach((e) => {
    const day = format(new Date(e.date), "MMM d")
    if (!chartMap[day]) chartMap[day] = { revenue: 0, expenses: 0, preTaxProfit: 0, netAfterTaxes: 0 }
    const dayRevenue   = e.revenueGenerated
    const dayExpenses  = e.adSpend + e.businessExpenses
    const dayPreTax    = dayRevenue - e.refunds - dayExpenses
    const dayTax       = dayPreTax > 0 ? dayPreTax * (taxRate / 100) : 0
    chartMap[day].revenue      += dayRevenue
    chartMap[day].expenses     += dayExpenses
    chartMap[day].preTaxProfit += dayPreTax
    chartMap[day].netAfterTaxes += dayPreTax - dayTax
  })
  const chartData = Object.entries(chartMap).map(([name, vals]) => ({ name, ...vals }))

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6">
        <h1 className="text-xl font-semibold text-foreground">Financials</h1>

        <Suspense fallback={<div className="h-9" />}>
          <div className="flex flex-wrap items-end gap-6">
            <DateRangeFilters />
            <TaxRateInput />
          </div>
        </Suspense>

        {/* Revenue & Expenses */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Revenue & Expenses</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard title="Cash Collected"    value={formatCurrency(cashCollected)}    icon={DollarSign} />
            <KpiCard title="Revenue Generated" value={formatCurrency(revenue)}          icon={TrendingUp} />
            <KpiCard title="Refunds"           value={formatCurrency(refunds)}          icon={ReceiptText} />
            <KpiCard title="Ad Spend"          value={formatCurrency(adSpend)}          icon={Megaphone} />
            <KpiCard title="Business Expenses" value={formatCurrency(businessExpenses)} icon={TrendingDown} />
            <KpiCard title="Total Expenses"    value={formatCurrency(totalExpenses)}    icon={TrendingDown} />
          </div>
        </div>

        {/* Profit */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Profit</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              title="Pre-Tax Profit"
              value={formatCurrency(preTaxProfit)}
              subtitle="Revenue − Refunds − Expenses"
              icon={TrendingUp}
            />
            <KpiCard
              title="Tax Liability"
              value={formatCurrency(taxAmount)}
              subtitle={`${formatPercent(taxRate)} of pre-tax profit`}
              icon={ReceiptText}
            />
            <KpiCard
              title="Net After Taxes"
              value={formatCurrency(netAfterTaxes)}
              subtitle={`Pre-tax profit − ${formatPercent(taxRate)} tax`}
              icon={PiggyBank}
            />
          </div>
        </div>

        {chartData.length > 0 ? (
          <MetricBarChart
            title="Financial Overview"
            data={chartData}
            bars={[
              { key: "revenue",       color: "#FBBF24", label: "Revenue" },
              { key: "expenses",      color: "#ef4444", label: "Expenses" },
              { key: "preTaxProfit",  color: "#f97316", label: "Pre-Tax Profit" },
              { key: "netAfterTaxes", color: "#22c55e", label: "Net After Taxes" },
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

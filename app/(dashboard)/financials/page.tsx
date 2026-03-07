import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Header } from "@/components/dashboard/header"
import { KpiCard } from "@/components/charts/kpi-card"
import { MetricBarChart } from "@/components/charts/metric-chart"
import { formatCurrency } from "@/lib/utils"
import { format, subMonths, startOfMonth } from "date-fns"
import { DollarSign, TrendingDown, TrendingUp, PiggyBank } from "lucide-react"
import FinancialEntryDialog from "./financial-entry-dialog"

export default async function FinancialsPage() {
  const session = await auth()
  const orgId = (session?.user as { organizationId?: string })?.organizationId

  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 6))

  const reports = await db.financialReport.findMany({
    where: { organizationId: orgId, date: { gte: sixMonthsAgo } },
    orderBy: { date: "asc" },
  })

  const latest = reports[reports.length - 1]

  const chartData = reports.map((r) => ({
    name: format(new Date(r.date), "MMM yyyy"),
    income: r.businessIncome,
    expenses: r.businessExpenses,
    netProfit: r.netAfterTaxes,
  }))

  return (
    <div className="flex flex-col h-full">
      <Header title="Financial Report" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-end">
          <FinancialEntryDialog orgId={orgId!} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Business Income"
            value={latest ? formatCurrency(latest.businessIncome) : "—"}
            icon={DollarSign}
          />
          <KpiCard
            title="Business Expenses"
            value={latest ? formatCurrency(latest.businessExpenses) : "—"}
            icon={TrendingDown}
          />
          <KpiCard
            title="Pre-Tax Profit"
            value={latest ? formatCurrency(latest.preTaxProfit) : "—"}
            icon={TrendingUp}
          />
          <KpiCard
            title="Net After Taxes"
            value={latest ? formatCurrency(latest.netAfterTaxes) : "—"}
            icon={PiggyBank}
          />
        </div>

        {chartData.length > 0 && (
          <MetricBarChart
            title="Monthly Financial Overview (Last 6 Months)"
            data={chartData}
            bars={[
              { key: "income", color: "#22c55e", label: "Income" },
              { key: "expenses", color: "#ef4444", label: "Expenses" },
              { key: "netProfit", color: "#6366f1", label: "Net Profit" },
            ]}
            valueFormatter={formatCurrency}
          />
        )}

        {reports.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            No financial reports yet. Click &quot;Add Report&quot; to log your first month.
          </div>
        )}
      </div>
    </div>
  )
}

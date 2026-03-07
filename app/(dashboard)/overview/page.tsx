import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { KpiCard } from "@/components/charts/kpi-card"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { SavedViewsBar } from "@/components/dashboard/saved-views-bar"
import {
  formatCurrency,
  formatNumber,
  calcShowUpRate,
  calcCloseRate,
} from "@/lib/utils"
import { subDays, startOfDay, parseISO, differenceInDays } from "date-fns"

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const session = await auth()
  const orgId = (session?.user as { organizationId?: string })?.organizationId

  const params = await searchParams
  const toDate   = params.to   ? startOfDay(parseISO(params.to))   : startOfDay(new Date())
  const fromDate = params.from ? startOfDay(parseISO(params.from)) : startOfDay(subDays(new Date(), 30))

  // Comparison period = same length, immediately before fromDate
  const rangeDays = Math.max(1, differenceInDays(toDate, fromDate))
  const prevTo   = fromDate
  const prevFrom = startOfDay(subDays(fromDate, rangeDays))

  const [currentEntries, previousEntries] = await Promise.all([
    db.dataEntry.findMany({
      where: { organizationId: orgId, date: { gte: fromDate, lte: toDate } },
    }),
    db.dataEntry.findMany({
      where: { organizationId: orgId, date: { gte: prevFrom, lt: prevTo } },
    }),
  ])

  const sum = (entries: typeof currentEntries, field: keyof (typeof currentEntries)[0]) =>
    entries.reduce((acc, e) => acc + Number(e[field]), 0)

  const scheduledCalls  = sum(currentEntries, "scheduledCalls")
  const showCalls       = sum(currentEntries, "showCalls")
  const dealsWon        = sum(currentEntries, "dealsWon")
  const offersMade      = sum(currentEntries, "offersMade")
  const cashCollected   = sum(currentEntries, "cashCollected")
  const revenueGenerated = sum(currentEntries, "revenueGenerated")
  const refunds         = sum(currentEntries, "refunds")

  const prevScheduled  = sum(previousEntries, "scheduledCalls")
  const prevShowCalls  = sum(previousEntries, "showCalls")
  const prevDeals      = sum(previousEntries, "dealsWon")
  const prevOffers     = sum(previousEntries, "offersMade")
  const prevCash       = sum(previousEntries, "cashCollected")
  const prevRevenue    = sum(previousEntries, "revenueGenerated")
  const prevRefunds    = sum(previousEntries, "refunds")

  const trend = (curr: number, prev: number) =>
    prev > 0 ? ((curr - prev) / prev) * 100 : 0

  const netRevenue     = revenueGenerated - refunds
  const prevNetRevenue = prevRevenue - prevRefunds

  const showRate   = calcShowUpRate(showCalls, scheduledCalls)
  const closeRate  = calcCloseRate(dealsWon, offersMade)
  const offersPct  = scheduledCalls > 0 ? (offersMade / scheduledCalls) * 100 : 0

  const prevShowRate  = calcShowUpRate(prevShowCalls, prevScheduled)
  const prevCloseRate = calcCloseRate(prevDeals, prevOffers)
  const prevOffersPct = prevScheduled > 0 ? (prevOffers / prevScheduled) * 100 : 0

  const showRateTrend  = prevShowRate  > 0 ? ((showRate  - prevShowRate)  / prevShowRate)  * 100 : 0
  const closeRateTrend = prevCloseRate > 0 ? ((closeRate - prevCloseRate) / prevCloseRate) * 100 : 0
  const offersPctTrend = prevOffersPct > 0 ? ((offersPct - prevOffersPct) / prevOffersPct) * 100 : 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6">
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>

        <Suspense fallback={<div className="h-9" />}>
          <DashboardFilters />
        </Suspense>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <SavedViewsBar />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard
            title="Scheduled Calls"
            value={formatNumber(scheduledCalls)}
            trend={trend(scheduledCalls, prevScheduled)}
          />
          <KpiCard
            title="Showed Calls"
            value={formatNumber(showCalls)}
            trend={trend(showCalls, prevShowCalls)}
          />
          <KpiCard
            title="Deals Won"
            value={formatNumber(dealsWon)}
            trend={trend(dealsWon, prevDeals)}
          />
          <KpiCard
            title="Offers Made"
            value={formatNumber(offersMade)}
            trend={trend(offersMade, prevOffers)}
          />
          <KpiCard
            title="Cash Collected"
            value={formatCurrency(cashCollected)}
            trend={trend(cashCollected, prevCash)}
          />
          <KpiCard
            title="Show Rate (%)"
            value={showRate.toFixed(2) + "%"}
            trend={showRateTrend}
          />
          <KpiCard
            title="Net Revenue"
            value={formatCurrency(netRevenue)}
            trend={trend(netRevenue, prevNetRevenue)}
          />
          <KpiCard
            title="Offers (%)"
            value={offersPct.toFixed(2) + "%"}
            trend={offersPctTrend}
          />
          <KpiCard
            title="Close (%)"
            value={closeRate.toFixed(2) + "%"}
            trend={closeRateTrend}
          />
          <KpiCard
            title="Revenue Generated"
            value={formatCurrency(revenueGenerated)}
            trend={trend(revenueGenerated, prevRevenue)}
          />
          <KpiCard
            title="Refunds"
            value={formatCurrency(refunds)}
            trend={trend(refunds, prevRefunds)}
          />
        </div>
      </div>
    </div>
  )
}

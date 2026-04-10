import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { KpiCard } from "@/components/charts/kpi-card"
import { MetricLineChart } from "@/components/charts/metric-chart"
import { formatNumber } from "@/lib/utils"
import { Suspense } from "react"
import { format, subDays, startOfDay, parseISO } from "date-fns"
import { Youtube, Instagram, Mail, Users } from "lucide-react"
import { DateRangeFilters } from "@/components/dashboard/date-range-filters"

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const session = await auth()
  const orgId = (session?.user as { organizationId?: string })?.organizationId

  const params = await searchParams
  const toDate   = params.to   ? startOfDay(parseISO(params.to))   : startOfDay(new Date())
  const fromDate = params.from ? startOfDay(parseISO(params.from)) : startOfDay(subDays(new Date(), 30))

  const metrics = await db.contentMetric.findMany({
    where: { organizationId: orgId, date: { gte: fromDate, lte: toDate } },
    orderBy: { date: "asc" },
  })

  const sum = (field: keyof typeof metrics[0]) =>
    metrics.reduce((acc, m) => acc + Number(m[field]), 0)

  const chartData = metrics.map((m) => ({
    name: format(new Date(m.date), "MMM d"),
    youtube: m.youtubeGrowth,
    instagram: m.instagramGrowth,
    emailOptIns: m.emailOptIns,
    organicReach: m.organicReach,
    qualifiedFollowers: m.qualifiedFollowerGrowth,
  }))

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6">
        <h1 className="text-xl font-semibold text-foreground">Content</h1>

        <Suspense fallback={<div className="h-9" />}>
          <DateRangeFilters />
        </Suspense>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard title="YouTube Growth"         value={formatNumber(sum("youtubeGrowth"))}           icon={Youtube} />
          <KpiCard title="Instagram Growth"       value={formatNumber(sum("instagramGrowth"))}         icon={Instagram} />
          <KpiCard title="Qualified Followers"    value={formatNumber(sum("qualifiedFollowerGrowth"))} icon={Users} />
          <KpiCard title="Email Opt-Ins"          value={formatNumber(sum("emailOptIns"))}             icon={Mail} />
          <KpiCard title="Organic Reach"          value={formatNumber(sum("organicReach"))} />
        </div>

        <MetricLineChart
          title="Follower Growth Trend"
          data={chartData}
          lines={[
            { key: "youtube",            color: "#ff0000", label: "YouTube" },
            { key: "instagram",          color: "#e1306c", label: "Instagram" },
            { key: "qualifiedFollowers", color: "#FBBF24", label: "Qualified Followers" },
          ]}
        />

        <MetricLineChart
          title="Email & Reach Trend"
          data={chartData}
          lines={[
            { key: "emailOptIns",   color: "#FBBF24", label: "Email Opt-Ins" },
            { key: "organicReach",  color: "#f59e0b", label: "Organic Reach" },
          ]}
        />
      </div>
    </div>
  )
}

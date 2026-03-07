import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Header } from "@/components/dashboard/header"
import { KpiCard } from "@/components/charts/kpi-card"
import { MetricLineChart } from "@/components/charts/metric-chart"
import { formatNumber } from "@/lib/utils"
import { format, subDays, startOfDay } from "date-fns"
import { Youtube, Instagram, Mail, Users } from "lucide-react"
import ContentEntryDialog from "./content-entry-dialog"

export default async function ContentPage() {
  const session = await auth()
  const orgId = (session?.user as { organizationId?: string })?.organizationId

  const thirtyDaysAgo = startOfDay(subDays(new Date(), 30))

  const metrics = await db.contentMetric.findMany({
    where: { organizationId: orgId, date: { gte: thirtyDaysAgo } },
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
      <Header title="Content" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-end">
          <ContentEntryDialog orgId={orgId!} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            title="YouTube Growth (30d)"
            value={formatNumber(sum("youtubeGrowth"))}
            icon={Youtube}
          />
          <KpiCard
            title="Instagram Growth (30d)"
            value={formatNumber(sum("instagramGrowth"))}
            icon={Instagram}
          />
          <KpiCard
            title="Qualified Followers (30d)"
            value={formatNumber(sum("qualifiedFollowerGrowth"))}
            icon={Users}
          />
          <KpiCard
            title="Email Opt-Ins (30d)"
            value={formatNumber(sum("emailOptIns"))}
            icon={Mail}
          />
          <KpiCard
            title="Organic Reach (30d)"
            value={formatNumber(sum("organicReach"))}
          />
        </div>

        <MetricLineChart
          title="Follower Growth Trend (Last 30 Days)"
          data={chartData}
          lines={[
            { key: "youtube", color: "#ff0000", label: "YouTube" },
            { key: "instagram", color: "#e1306c", label: "Instagram" },
            { key: "qualifiedFollowers", color: "#6366f1", label: "Qualified Followers" },
          ]}
        />

        <MetricLineChart
          title="Email & Reach Trend (Last 30 Days)"
          data={chartData}
          lines={[
            { key: "emailOptIns", color: "#22c55e", label: "Email Opt-Ins" },
            { key: "organicReach", color: "#f59e0b", label: "Organic Reach" },
          ]}
        />
      </div>
    </div>
  )
}

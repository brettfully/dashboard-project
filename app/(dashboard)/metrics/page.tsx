import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import AddCustomMetricDialog from "./add-metric-dialog"

const DEFAULT_METRICS = [
  "Scheduled Calls",
  "Open Messages",
  "Show Calls",
  "Offers Made",
  "Deals Won",
  "Revenue Generated",
  "Cash Collected",
  "Refunds",
  "Ad Spend",
]

const DEFAULT_CONTENT_METRICS = [
  "YouTube Growth",
  "Instagram Growth",
  "Qualified Follower Growth",
  "Email Opt-Ins",
  "Organic Reach",
]

export default async function MetricsPage() {
  const session = await auth()
  const orgId = (session?.user as { organizationId?: string })?.organizationId

  const customMetrics = await db.customMetric.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="flex flex-col h-full">
      <Header title="Metrics" />
      <div className="flex-1 p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Default Sales Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_METRICS.map((m) => (
                <Badge key={m} variant="secondary" className="text-sm py-1 px-3">
                  {m}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Content Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CONTENT_METRICS.map((m) => (
                <Badge key={m} variant="secondary" className="text-sm py-1 px-3">
                  {m}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Custom Metrics</CardTitle>
            <AddCustomMetricDialog orgId={orgId!} />
          </CardHeader>
          <CardContent>
            {customMetrics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No custom metrics yet. Add one to track additional data points.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {customMetrics.map((m) => (
                  <Badge key={m.id} variant="outline" className="text-sm py-1 px-3">
                    {m.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { MetricsContent } from "./metrics-content"

export default async function MetricsPage() {
  const session = await auth()
  const orgId = (session?.user as { organizationId?: string })?.organizationId

  const [customMetrics, products] = await Promise.all([
    db.customMetric.findMany({
      where: { organizationId: orgId },
      include: { updatedBy: true },
      orderBy: { createdAt: "asc" },
    }),
    db.product.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  const metricsWithSerializedDates = customMetrics.map((m) => ({
    ...m,
    updatedAt: m.updatedAt,
  }))

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6">
        <h1 className="text-xl font-semibold text-foreground">Metrics</h1>
        <MetricsContent metrics={metricsWithSerializedDates} products={products} />
      </div>
    </div>
  )
}

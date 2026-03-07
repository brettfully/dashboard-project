import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// POST /api/custom-metrics/entries
// Body: { date, productId, entries: [{ customMetricId, value }] }
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const orgId = (session.user as { organizationId?: string }).organizationId
  const body = await req.json()

  const { date, productId, entries } = body as {
    date: string
    productId: string
    entries: { customMetricId: string; value: number }[]
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: "No entries provided" }, { status: 400 })
  }

  // Verify all metrics belong to this org
  const metricIds = entries.map((e) => e.customMetricId)
  const metrics = await db.customMetric.findMany({
    where: { id: { in: metricIds }, organizationId: orgId },
  })

  if (metrics.length !== metricIds.length) {
    return NextResponse.json({ error: "Invalid metric IDs" }, { status: 400 })
  }

  const created = await db.customMetricEntry.createMany({
    data: entries.map((e) => ({
      customMetricId: e.customMetricId,
      value: e.value,
      date: new Date(date),
      userId,
      productId: productId || null,
    })),
  })

  return NextResponse.json({ count: created.count }, { status: 201 })
}

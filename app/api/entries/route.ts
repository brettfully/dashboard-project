import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = (session.user as { organizationId?: string }).organizationId
  const entries = await db.dataEntry.findMany({
    where: { organizationId: orgId },
    include: { user: true, product: true },
    orderBy: { date: "desc" },
  })

  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = (session.user as { organizationId?: string }).organizationId
  const body = await req.json()
  const { customMetricEntries, ...entryData } = body

  if (!entryData.productId || entryData.productId === "none") {
    return NextResponse.json({ error: "productId is required" }, { status: 400 })
  }

  try {
    const dateStart = new Date(entryData.date + "T00:00:00.000Z")
    const dateEnd = new Date(entryData.date + "T23:59:59.999Z")
    const parsedDate = new Date(entryData.date + "T12:00:00.000Z")

    const existing = await db.dataEntry.findFirst({
      where: {
        userId: entryData.userId,
        productId: entryData.productId ?? null,
        organizationId: orgId,
        date: { gte: dateStart, lte: dateEnd },
      },
    })

    const { date: _date, ...entryFields } = entryData
    const entryPayload = { ...entryFields, organizationId: orgId, date: parsedDate }

    let entry
    if (existing) {
      entry = await db.dataEntry.update({ where: { id: existing.id }, data: entryPayload })
    } else {
      entry = await db.dataEntry.create({ data: entryPayload })
    }

    if (customMetricEntries && customMetricEntries.length > 0) {
      // Delete existing custom metric entries for this date and upsert fresh
      await db.customMetricEntry.deleteMany({
        where: {
          customMetricId: { in: customMetricEntries.map((e: { customMetricId: string }) => e.customMetricId) },
          userId: entryData.userId,
          date: { gte: dateStart, lte: dateEnd },
        },
      })
      await db.customMetricEntry.createMany({
        data: customMetricEntries.map((e: { customMetricId: string; value: number }) => ({
          customMetricId: e.customMetricId,
          value: e.value,
          date: parsedDate,
          userId: entryData.userId,
        })),
      })
    }

    return NextResponse.json(entry, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("Failed to create data entry:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

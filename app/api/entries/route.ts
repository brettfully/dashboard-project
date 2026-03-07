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
    const entry = await db.dataEntry.create({
      data: {
        ...entryData,
        organizationId: orgId,
      },
    })

    if (customMetricEntries && customMetricEntries.length > 0) {
      await db.customMetricEntry.createMany({
        data: customMetricEntries.map((e: { customMetricId: string; value: number }) => ({
          customMetricId: e.customMetricId,
          value: e.value,
          date: entryData.date,
        })),
      })
    }

    return NextResponse.json(entry, { status: 201 })
  } catch (err) {
    console.error("Failed to create data entry:", err)
    return NextResponse.json({ error: "Failed to save entry. Check server logs." }, { status: 500 })
  }
}

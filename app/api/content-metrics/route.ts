import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = (session.user as { organizationId?: string }).organizationId
  const metrics = await db.contentMetric.findMany({
    where: { organizationId: orgId },
    orderBy: { date: "desc" },
  })

  return NextResponse.json(metrics)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = (session.user as { organizationId?: string }).organizationId
  const body = await req.json()

  const dateStart = new Date(body.date + "T00:00:00.000Z")
  const dateEnd = new Date(body.date + "T23:59:59.999Z")
  const parsedDate = new Date(body.date + "T12:00:00.000Z")

  const metricData = {
    organizationId: orgId!,
    date: parsedDate,
    youtubeGrowth: parseInt(body.youtubeGrowth) || 0,
    instagramGrowth: parseInt(body.instagramGrowth) || 0,
    qualifiedFollowerGrowth: parseInt(body.qualifiedFollowerGrowth) || 0,
    emailOptIns: parseInt(body.emailOptIns) || 0,
    organicReach: parseInt(body.organicReach) || 0,
  }

  const existing = await db.contentMetric.findFirst({
    where: { organizationId: orgId, date: { gte: dateStart, lte: dateEnd } },
  })

  const metric = existing
    ? await db.contentMetric.update({ where: { id: existing.id }, data: metricData })
    : await db.contentMetric.create({ data: metricData })

  return NextResponse.json(metric, { status: 201 })
}

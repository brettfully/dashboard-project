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

  const metric = await db.contentMetric.create({
    data: {
      organizationId: orgId!,
      date: new Date(body.date),
      youtubeGrowth: parseInt(body.youtubeGrowth) || 0,
      instagramGrowth: parseInt(body.instagramGrowth) || 0,
      qualifiedFollowerGrowth: parseInt(body.qualifiedFollowerGrowth) || 0,
      emailOptIns: parseInt(body.emailOptIns) || 0,
      organicReach: parseInt(body.organicReach) || 0,
    },
  })

  return NextResponse.json(metric, { status: 201 })
}

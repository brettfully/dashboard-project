import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = (session.user as { organizationId?: string }).organizationId
  const metrics = await db.customMetric.findMany({
    where: { organizationId: orgId },
    include: { entries: true },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(metrics)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = (session.user as { organizationId?: string }).organizationId
  const body = await req.json()

  const metric = await db.customMetric.create({
    data: {
      name: body.name,
      organizationId: orgId!,
    },
  })

  return NextResponse.json(metric, { status: 201 })
}

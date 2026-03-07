import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const orgId = (session.user as { organizationId?: string }).organizationId

  const views = await db.dashboardView.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(views)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const orgId = (session.user as { organizationId?: string }).organizationId
  const body = await req.json()

  const existing = await db.dashboardView.count({ where: { organizationId: orgId } })
  const view = await db.dashboardView.create({
    data: {
      organizationId: orgId!,
      name: body.name,
      isDefault: existing === 0,
    },
  })
  return NextResponse.json(view, { status: 201 })
}

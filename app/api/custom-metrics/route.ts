import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = (session.user as { organizationId?: string }).organizationId
  const metrics = await db.customMetric.findMany({
    where: { organizationId: orgId },
    include: { entries: true, updatedBy: true },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(metrics)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = (session.user as { organizationId?: string }).organizationId
  const userId = session.user.id
  const body = await req.json()

  const metric = await db.customMetric.create({
    data: {
      name: body.name,
      organizationId: orgId!,
      type: body.type ?? "NUMBER",
      role: body.role ?? null,
      productIds: Array.isArray(body.productIds) ? body.productIds : null,
      firstField: body.firstField ?? null,
      operator: body.operator ?? null,
      secondField: body.secondField ?? null,
      showResultAs: body.showResultAs ?? null,
      status: body.status ?? "ACTIVE",
      updatedAt: new Date(),
      updatedById: userId,
    },
  })

  return NextResponse.json(metric, { status: 201 })
}

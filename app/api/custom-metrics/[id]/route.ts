import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = (session.user as { organizationId?: string }).organizationId
  const userId = session.user.id
  const { id } = await params
  const body = await req.json()

  const existing = await db.customMetric.findFirst({
    where: { id, organizationId: orgId },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const metric = await db.customMetric.update({
    where: { id },
    data: {
      ...(body.name != null && { name: body.name }),
      ...(body.type != null && { type: body.type }),
      ...(body.role !== undefined && { role: body.role || null }),
      ...(body.productIds !== undefined && {
        productIds: Array.isArray(body.productIds) ? body.productIds : null,
      }),
      ...(body.firstField !== undefined && { firstField: body.firstField || null }),
      ...(body.operator !== undefined && { operator: body.operator || null }),
      ...(body.secondField !== undefined && { secondField: body.secondField || null }),
      ...(body.showResultAs !== undefined && { showResultAs: body.showResultAs || null }),
      ...(body.status != null && { status: body.status }),
      updatedAt: new Date(),
      updatedById: userId,
    },
  })

  return NextResponse.json(metric)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = (session.user as { organizationId?: string }).organizationId
  const { id } = await params

  const existing = await db.customMetric.findFirst({
    where: { id, organizationId: orgId },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.customMetric.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}

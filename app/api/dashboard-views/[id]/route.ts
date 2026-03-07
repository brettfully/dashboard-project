import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const orgId = (session.user as { organizationId?: string }).organizationId
  const { id } = await params

  const existing = await db.dashboardView.findFirst({ where: { id, organizationId: orgId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Delete all cells for this view, then delete the view
  await db.overviewCell.deleteMany({ where: { viewId: id } })
  await db.dashboardView.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const orgId = (session.user as { organizationId?: string }).organizationId
  const { id } = await params
  const body = await req.json()

  const existing = await db.dashboardView.findFirst({ where: { id, organizationId: orgId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const view = await db.dashboardView.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
    },
  })
  return NextResponse.json(view)
}

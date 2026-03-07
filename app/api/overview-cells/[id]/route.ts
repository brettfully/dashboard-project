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

  const existing = await db.overviewCell.findFirst({ where: { id, organizationId: orgId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.overviewCell.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}

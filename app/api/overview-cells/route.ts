import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const orgId = (session.user as { organizationId?: string }).organizationId
  const cells = await db.overviewCell.findMany({
    where: { organizationId: orgId },
    orderBy: { position: "asc" },
  })
  return NextResponse.json(cells)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const orgId = (session.user as { organizationId?: string }).organizationId
  const body = await req.json()

  const count = await db.overviewCell.count({ where: { organizationId: orgId } })
  const cell = await db.overviewCell.create({
    data: {
      organizationId: orgId!,
      label: body.label,
      source: body.source,
      fieldName: body.fieldName,
      displayAs: body.displayAs ?? "number",
      position: count,
    },
  })
  return NextResponse.json(cell, { status: 201 })
}

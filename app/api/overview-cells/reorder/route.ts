import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// POST body: { order: string[] } — array of cell IDs in new order
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const orgId = (session.user as { organizationId?: string }).organizationId
  const { order } = await req.json()

  if (!Array.isArray(order)) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  // Verify all cells belong to this org
  const cells = await db.overviewCell.findMany({
    where: { id: { in: order }, organizationId: orgId },
    select: { id: true },
  })
  if (cells.length !== order.length) {
    return NextResponse.json({ error: "Invalid cell IDs" }, { status: 400 })
  }

  await Promise.all(
    order.map((id: string, index: number) =>
      db.overviewCell.update({ where: { id }, data: { position: index } })
    )
  )

  return new NextResponse(null, { status: 204 })
}

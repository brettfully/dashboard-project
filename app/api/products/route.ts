import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = (session.user as { organizationId?: string }).organizationId
  const products = await db.product.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = (session.user as { organizationId?: string }).organizationId
  const body = await req.json()

  try {
    const product = await db.product.create({
      data: {
        organizationId: orgId!,
        name: body.name,
        price: parseFloat(body.price) || 0,
        description: body.description || null,
      },
    })
    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    console.error("Failed to create product:", err)
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const product = await db.product.update({
    where: { id },
    data: {
      name: body.name,
      price: parseFloat(body.price),
      description: body.description,
      active: body.active,
    },
  })

  return NextResponse.json(product)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.product.update({ where: { id }, data: { active: false } })

  return NextResponse.json({ success: true })
}

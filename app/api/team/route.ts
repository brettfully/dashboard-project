import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = (session.user as { organizationId?: string }).organizationId
  const members = await db.user.findMany({
    where: { organizationId: orgId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(members)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = (session.user as { organizationId?: string }).organizationId
  const body = await req.json()
  const { name, email, password, role } = body

  if (!email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await db.user.create({
    data: {
      name,
      email,
      hashedPassword,
      role: role ?? "ACCOUNT_EXECUTIVE",
      organizationId: orgId!,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  return NextResponse.json(user, { status: 201 })
}

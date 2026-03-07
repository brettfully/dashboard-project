import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, organizationName } = await req.json()

    if (!email || !password || !organizationName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const org = await db.organization.create({
      data: { name: organizationName },
    })

    await db.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role: "COMPANY_ADMIN",
        organizationId: org.id,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

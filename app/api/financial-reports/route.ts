import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = (session.user as { organizationId?: string }).organizationId
  const reports = await db.financialReport.findMany({
    where: { organizationId: orgId },
    orderBy: { date: "desc" },
  })

  return NextResponse.json(reports)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = (session.user as { organizationId?: string }).organizationId
  const body = await req.json()

  const report = await db.financialReport.create({
    data: {
      organizationId: orgId!,
      date: new Date(body.date),
      businessIncome: parseFloat(body.businessIncome) || 0,
      businessExpenses: parseFloat(body.businessExpenses) || 0,
      preTaxProfit: parseFloat(body.preTaxProfit) || 0,
      netAfterTaxes: parseFloat(body.netAfterTaxes) || 0,
    },
  })

  return NextResponse.json(report, { status: 201 })
}

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { format } from "date-fns"
import ManagerForm from "./manager-form"
import { EntryRowActions } from "@/components/dashboard/entry-row-actions"

export default async function ManagerDataEntryPage() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  const orgId = (session?.user as { organizationId?: string })?.organizationId
  const userId = session?.user?.id

  if (role !== "SALES_MANAGER" && role !== "COMPANY_ADMIN") {
    if (role === "SDR") redirect("/data-entry/sdr")
    if (role === "ACCOUNT_EXECUTIVE") redirect("/data-entry/ae")
    redirect("/overview")
  }

  const [products, entries, customMetrics] = await Promise.all([
    db.product.findMany({
      where: { organizationId: orgId, active: true },
      orderBy: { name: "asc" },
    }),
    db.dataEntry.findMany({
      where: { organizationId: orgId },
      include: { product: true, user: true },
      orderBy: { date: "desc" },
      take: 50,
    }),
    db.customMetric.findMany({
      where: { organizationId: orgId, status: "ACTIVE", type: { not: "CALCULATED" } },
      orderBy: { createdAt: "asc" },
    }),
  ])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6">
        <h1 className="text-xl font-semibold text-foreground">Data Entry — Manager</h1>
        <div className="w-1/2 min-w-[400px]">
          <ManagerForm
            products={products.map((p) => ({ id: p.id, name: p.name }))}
            userId={userId!}
            orgId={orgId!}
            customMetrics={customMetrics.map((m) => ({
              id: m.id,
              name: m.name,
              type: m.type,
              category: m.category,
              productIds: Array.isArray(m.productIds) ? (m.productIds as string[]) : [],
            }))}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Org Submission History (Last 50)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Rep</TableHead>
                  <TableHead>Offer</TableHead>
                  <TableHead className="text-right">Sets</TableHead>
                  <TableHead className="text-right">Closed</TableHead>
                  <TableHead className="text-right">Cash</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Ad Spend</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(entry.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.user.name ?? entry.user.email}
                    </TableCell>
                    <TableCell>
                      {entry.product ? (
                        <Badge variant="secondary">{entry.product.name}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(entry.setsBooked)}</TableCell>
                    <TableCell className="text-right">{formatNumber(entry.dealsWon)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.cashCollected)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.revenueGenerated)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.adSpend)}</TableCell>
                    <TableCell>
                      <EntryRowActions entry={{
                        id: entry.id,
                        date: entry.date,
                        productId: entry.productId,
                        productName: entry.product?.name ?? null,
                        setsBooked: entry.setsBooked,
                        dealsWon: entry.dealsWon,
                        cashCollected: entry.cashCollected,
                        revenueGenerated: entry.revenueGenerated,
                        refunds: entry.refunds,
                        adSpend: entry.adSpend,
                        dials: entry.dials,
                        outboundMessages: entry.outboundMessages,
                        inboundMessages: entry.inboundMessages,
                        followUps: entry.followUps,
                        callsToday: entry.callsToday,
                        lowTicketCustomers: entry.lowTicketCustomers,
                        monthlyRecurringRevenue: entry.monthlyRecurringRevenue,
                        customersCanceled: entry.customersCanceled,
                        businessExpenses: entry.businessExpenses,
                        highTicketLandingPageViews: entry.highTicketLandingPageViews,
                        lowTicketLandingPageViews: entry.lowTicketLandingPageViews,
                      }} />
                    </TableCell>
                  </TableRow>
                ))}
                {entries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No entries yet. Submit your first daily metrics above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

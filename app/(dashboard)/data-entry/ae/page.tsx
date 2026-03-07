import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { format } from "date-fns"
import AeForm from "./ae-form"

export default async function AeDataEntryPage() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  const orgId = (session?.user as { organizationId?: string })?.organizationId
  const userId = session?.user?.id

  if (role !== "ACCOUNT_EXECUTIVE") {
    if (role === "SDR") redirect("/data-entry/sdr")
    if (role === "SALES_MANAGER" || role === "COMPANY_ADMIN") redirect("/data-entry/manager")
    redirect("/overview")
  }

  const [products, entries] = await Promise.all([
    db.product.findMany({
      where: { organizationId: orgId, active: true },
      orderBy: { name: "asc" },
    }),
    db.dataEntry.findMany({
      where: { organizationId: orgId, userId },
      include: { product: true },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6">
        <h1 className="text-xl font-semibold text-foreground">Data Entry — Account Executive</h1>
        <div className="w-1/2 min-w-[400px]">
          <AeForm
            products={products.map((p) => ({ id: p.id, name: p.name }))}
            userId={userId!}
            orgId={orgId!}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Offer</TableHead>
                  <TableHead className="text-right">Calls Today</TableHead>
                  <TableHead className="text-right">Showed</TableHead>
                  <TableHead className="text-right">Offers</TableHead>
                  <TableHead className="text-right">Closed</TableHead>
                  <TableHead className="text-right">Cash</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(entry.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {entry.product ? (
                        <Badge variant="secondary">{entry.product.name}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(entry.callsToday)}</TableCell>
                    <TableCell className="text-right">{formatNumber(entry.showCalls)}</TableCell>
                    <TableCell className="text-right">{formatNumber(entry.offersMade)}</TableCell>
                    <TableCell className="text-right">{formatNumber(entry.dealsWon)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.cashCollected)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.revenueGenerated)}</TableCell>
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

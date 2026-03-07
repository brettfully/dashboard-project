import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { format } from "date-fns"
import DataEntryForm from "./data-entry-form"

export default async function DataEntryPage() {
  const session = await auth()
  const orgId = (session?.user as { organizationId?: string })?.organizationId
  const userId = session?.user?.id

  const [products, entries, customMetrics] = await Promise.all([
    db.product.findMany({
      where: { organizationId: orgId, active: true },
      orderBy: { name: "asc" },
    }),
    db.dataEntry.findMany({
      where: { organizationId: orgId },
      include: { user: true, product: true },
      orderBy: { date: "desc" },
      take: 50,
    }),
    db.customMetric.findMany({
      where: { organizationId: orgId },
    }),
  ])

  return (
    <div className="flex flex-col h-full">
      <Header title="Data Entry" />
      <div className="flex-1 p-6 space-y-6">
        <DataEntryForm
          products={products.map((p) => ({ id: p.id, name: p.name }))}
          customMetrics={customMetrics.map((m) => ({ id: m.id, name: m.name }))}
          userId={userId!}
          orgId={orgId!}
        />

        <Card>
          <CardHeader>
            <CardTitle>Submission History (Last 50)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Rep</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                  <TableHead className="text-right">Deals</TableHead>
                  <TableHead className="text-right">Cash</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Ad Spend</TableHead>
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
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(entry.scheduledCalls)}</TableCell>
                    <TableCell className="text-right">{formatNumber(entry.dealsWon)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.cashCollected)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.revenueGenerated)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.adSpend)}</TableCell>
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

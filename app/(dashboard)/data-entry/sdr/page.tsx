import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatNumber } from "@/lib/utils"
import { format } from "date-fns"
import SdrForm from "./sdr-form"

export default async function SdrDataEntryPage() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  const orgId = (session?.user as { organizationId?: string })?.organizationId
  const userId = session?.user?.id

  if (role !== "SDR") {
    if (role === "ACCOUNT_EXECUTIVE") redirect("/data-entry/ae")
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
        <h1 className="text-xl font-semibold text-foreground">Data Entry — SDR</h1>
        <div className="w-1/2 min-w-[400px]">
          <SdrForm
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
                  <TableHead className="text-right">Dials</TableHead>
                  <TableHead className="text-right">Outbound</TableHead>
                  <TableHead className="text-right">Inbound</TableHead>
                  <TableHead className="text-right">Follow-ups</TableHead>
                  <TableHead className="text-right">Sets Booked</TableHead>
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
                    <TableCell className="text-right">{formatNumber(entry.dials)}</TableCell>
                    <TableCell className="text-right">{formatNumber(entry.outboundMessages)}</TableCell>
                    <TableCell className="text-right">{formatNumber(entry.inboundMessages)}</TableCell>
                    <TableCell className="text-right">{formatNumber(entry.followUps)}</TableCell>
                    <TableCell className="text-right">{formatNumber(entry.setsBooked)}</TableCell>
                  </TableRow>
                ))}
                {entries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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

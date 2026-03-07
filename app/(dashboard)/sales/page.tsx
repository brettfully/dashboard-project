import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Header } from "@/components/dashboard/header"
import { KpiCard } from "@/components/charts/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  calcShowUpRate,
  calcCloseRate,
} from "@/lib/utils"
import { subDays, startOfDay } from "date-fns"

export default async function SalesPage() {
  const session = await auth()
  const orgId = (session?.user as { organizationId?: string })?.organizationId

  const thirtyDaysAgo = startOfDay(subDays(new Date(), 30))

  const entries = await db.dataEntry.findMany({
    where: { organizationId: orgId, date: { gte: thirtyDaysAgo } },
    include: { user: true },
  })

  const sum = (field: keyof typeof entries[0]) =>
    entries.reduce((acc, e) => acc + Number(e[field]), 0)

  const scheduledCalls = sum("scheduledCalls")
  const showCalls = sum("showCalls")
  const offersMade = sum("offersMade")
  const dealsWon = sum("dealsWon")
  const cashCollected = sum("cashCollected")
  const revenue = sum("revenueGenerated")

  const showUpRate = calcShowUpRate(showCalls, scheduledCalls)
  const closeRate = calcCloseRate(dealsWon, offersMade)

  // Leaderboard: aggregate by user
  const leaderboard: Record<
    string,
    { name: string; dealsWon: number; cashCollected: number; revenue: number; offersMade: number }
  > = {}
  entries.forEach((e) => {
    const id = e.userId
    if (!leaderboard[id]) {
      leaderboard[id] = {
        name: e.user.name ?? e.user.email,
        dealsWon: 0,
        cashCollected: 0,
        revenue: 0,
        offersMade: 0,
      }
    }
    leaderboard[id].dealsWon += e.dealsWon
    leaderboard[id].cashCollected += e.cashCollected
    leaderboard[id].revenue += e.revenueGenerated
    leaderboard[id].offersMade += e.offersMade
  })

  const leaderboardRows = Object.values(leaderboard).sort((a, b) => b.cashCollected - a.cashCollected)

  return (
    <div className="flex flex-col h-full">
      <Header title="Sales" />
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard title="Calls Booked" value={formatNumber(scheduledCalls)} />
          <KpiCard title="Show Calls" value={formatNumber(showCalls)} />
          <KpiCard title="Show-Up Rate" value={formatPercent(showUpRate)} />
          <KpiCard title="Offers Made" value={formatNumber(offersMade)} />
          <KpiCard title="Deals Won" value={formatNumber(dealsWon)} />
          <KpiCard title="Close Rate" value={formatPercent(closeRate)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <KpiCard title="Cash Collected (30d)" value={formatCurrency(cashCollected)} />
          <KpiCard title="Revenue Generated (30d)" value={formatCurrency(revenue)} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Closer Leaderboard (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Deals Won</TableHead>
                  <TableHead className="text-right">Close Rate</TableHead>
                  <TableHead className="text-right">Cash Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardRows.map((rep, i) => (
                  <TableRow key={rep.name}>
                    <TableCell>
                      <Badge variant={i === 0 ? "default" : i === 1 ? "secondary" : "outline"}>
                        #{i + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{rep.name}</TableCell>
                    <TableCell className="text-right">{rep.dealsWon}</TableCell>
                    <TableCell className="text-right">
                      {formatPercent(calcCloseRate(rep.dealsWon, rep.offersMade))}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(rep.cashCollected)}
                    </TableCell>
                  </TableRow>
                ))}
                {leaderboardRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No data entries yet. Add data in the Data Entry tab.
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

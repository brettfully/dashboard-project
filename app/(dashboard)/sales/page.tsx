import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { KpiCard } from "@/components/charts/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Suspense } from "react"
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  calcShowUpRate,
  calcCloseRate,
} from "@/lib/utils"
import { DateRangeFilters } from "@/components/dashboard/date-range-filters"

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const session = await auth()
  const orgId = (session?.user as { organizationId?: string })?.organizationId

  const params = await searchParams
  const toDate   = params.to   ? new Date(params.to   + "T23:59:59.999Z") : new Date()
  const fromDate = params.from ? new Date(params.from + "T00:00:00.000Z") : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const entries = await db.dataEntry.findMany({
    where: { organizationId: orgId, date: { gte: fromDate, lte: toDate } },
    include: { user: true },
  })

  const sum = (field: keyof typeof entries[0]) =>
    entries.reduce((acc, e) => acc + Number(e[field]), 0)

  const scheduledCalls = sum("setsBooked")
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
    { name: string; callsToday: number; showCalls: number; offersMade: number; dealsWon: number; cashCollected: number; revenue: number }
  > = {}
  entries.forEach((e) => {
    const id = e.userId
    if (!leaderboard[id]) {
      leaderboard[id] = {
        name: e.user.name ?? e.user.email,
        callsToday: 0,
        showCalls: 0,
        offersMade: 0,
        dealsWon: 0,
        cashCollected: 0,
        revenue: 0,
      }
    }
    leaderboard[id].callsToday += e.callsToday
    leaderboard[id].showCalls += e.showCalls
    leaderboard[id].offersMade += e.offersMade
    leaderboard[id].dealsWon += e.dealsWon
    leaderboard[id].cashCollected += e.cashCollected
    leaderboard[id].revenue += e.revenueGenerated
  })

  const leaderboardRows = Object.values(leaderboard).sort((a, b) => b.cashCollected - a.cashCollected)

  // Setter leaderboard: aggregate by user
  const setterBoard: Record<
    string,
    { name: string; dials: number; outboundMessages: number; inboundMessages: number; followUps: number; setsBooked: number }
  > = {}
  entries.forEach((e) => {
    const id = e.userId
    if (!setterBoard[id]) {
      setterBoard[id] = {
        name: e.user.name ?? e.user.email,
        dials: 0,
        outboundMessages: 0,
        inboundMessages: 0,
        followUps: 0,
        setsBooked: 0,
      }
    }
    setterBoard[id].dials += e.dials
    setterBoard[id].outboundMessages += e.outboundMessages
    setterBoard[id].inboundMessages += e.inboundMessages
    setterBoard[id].followUps += e.followUps
    setterBoard[id].setsBooked += e.setsBooked
  })

  const setterRows = Object.values(setterBoard)
    .filter((r) => r.dials + r.outboundMessages + r.setsBooked > 0)
    .sort((a, b) => b.setsBooked - a.setsBooked)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6">
        <h1 className="text-xl font-semibold text-foreground">Sales</h1>

        <Suspense fallback={<div className="h-9" />}>
          <DateRangeFilters />
        </Suspense>

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
            <CardTitle>Closer Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Calls Due</TableHead>
                  <TableHead className="text-right">Calls Shown</TableHead>
                  <TableHead className="text-right">Offers Made</TableHead>
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
                    <TableCell className="text-right">{formatNumber(rep.callsToday)}</TableCell>
                    <TableCell className="text-right">{formatNumber(rep.showCalls)}</TableCell>
                    <TableCell className="text-right">{formatNumber(rep.offersMade)}</TableCell>
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
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No data entries yet. Add data in the Data Entry tab.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Setter Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Dials</TableHead>
                  <TableHead className="text-right">Outbound Messages</TableHead>
                  <TableHead className="text-right">Inbound Messages</TableHead>
                  <TableHead className="text-right">Follow-ups</TableHead>
                  <TableHead className="text-right">Sets Booked</TableHead>
                  <TableHead className="text-right">Set Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {setterRows.map((rep, i) => (
                  <TableRow key={rep.name}>
                    <TableCell>
                      <Badge variant={i === 0 ? "default" : i === 1 ? "secondary" : "outline"}>
                        #{i + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{rep.name}</TableCell>
                    <TableCell className="text-right">{formatNumber(rep.dials)}</TableCell>
                    <TableCell className="text-right">{formatNumber(rep.outboundMessages)}</TableCell>
                    <TableCell className="text-right">{formatNumber(rep.inboundMessages)}</TableCell>
                    <TableCell className="text-right">{formatNumber(rep.followUps)}</TableCell>
                    <TableCell className="text-right font-medium">{formatNumber(rep.setsBooked)}</TableCell>
                    <TableCell className="text-right">
                      {formatPercent(rep.dials > 0 ? (rep.setsBooked / rep.dials) * 100 : 0)}
                    </TableCell>
                  </TableRow>
                ))}
                {setterRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No setter data yet. Add data in the Data Entry tab.
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

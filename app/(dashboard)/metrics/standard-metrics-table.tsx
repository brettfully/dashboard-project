"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Lock } from "lucide-react"

type StandardMetric = {
  name: string
  field: string
  category: string
  categoryLabel: string
  displayAs: "number" | "currency"
  source: "dataentry" | "content"
}

const STANDARD_METRICS: StandardMetric[] = [
  // Sales — Prospecting
  { name: "Dials",                   field: "dials",                     category: "sales",     categoryLabel: "Sales",       displayAs: "number",   source: "dataentry" },
  { name: "Outbound Messages",       field: "outboundMessages",          category: "sales",     categoryLabel: "Sales",       displayAs: "number",   source: "dataentry" },
  { name: "Inbound Messages",        field: "inboundMessages",           category: "sales",     categoryLabel: "Sales",       displayAs: "number",   source: "dataentry" },
  { name: "Follow-ups",              field: "followUps",                 category: "sales",     categoryLabel: "Sales",       displayAs: "number",   source: "dataentry" },
  { name: "Sets Booked",             field: "setsBooked",                category: "sales",     categoryLabel: "Sales",       displayAs: "number",   source: "dataentry" },
  { name: "Calls Today",             field: "callsToday",                category: "sales",     categoryLabel: "Sales",       displayAs: "number",   source: "dataentry" },
  { name: "Closes Today",            field: "dealsWon",                  category: "sales",     categoryLabel: "Sales",       displayAs: "number",   source: "dataentry" },
  { name: "Cash Collected",          field: "cashCollected",             category: "sales",     categoryLabel: "Sales",       displayAs: "currency", source: "dataentry" },
  { name: "Revenue Generated",       field: "revenueGenerated",          category: "sales",     categoryLabel: "Sales",       displayAs: "currency", source: "dataentry" },
  { name: "Refunds",                 field: "refunds",                   category: "sales",     categoryLabel: "Sales",       displayAs: "currency", source: "dataentry" },
  { name: "MRR Collected",           field: "monthlyRecurringRevenue",   category: "sales",     categoryLabel: "Sales",       displayAs: "currency", source: "dataentry" },
  { name: "Low-Ticket Customers",    field: "lowTicketCustomers",        category: "sales",     categoryLabel: "Sales",       displayAs: "number",   source: "dataentry" },
  { name: "Customers Canceled",      field: "customersCanceled",         category: "sales",     categoryLabel: "Sales",       displayAs: "number",   source: "dataentry" },
  // Ads + Funnel
  { name: "Ad Spend",                field: "adSpend",                   category: "ads_funnel", categoryLabel: "Ads + Funnel", displayAs: "currency", source: "dataentry" },
  { name: "HT Landing Page Views",   field: "highTicketLandingPageViews", category: "ads_funnel", categoryLabel: "Ads + Funnel", displayAs: "number",  source: "dataentry" },
  { name: "LT Landing Page Views",   field: "lowTicketLandingPageViews", category: "ads_funnel", categoryLabel: "Ads + Funnel", displayAs: "number",   source: "dataentry" },
  { name: "Email Opt-ins",           field: "emailOptIns",               category: "ads_funnel", categoryLabel: "Ads + Funnel", displayAs: "number",  source: "content" },
  // Organic
  { name: "YouTube Growth",          field: "youtubeGrowth",             category: "organic",   categoryLabel: "Organic",     displayAs: "number",   source: "content" },
  { name: "Instagram Growth",        field: "instagramGrowth",           category: "organic",   categoryLabel: "Organic",     displayAs: "number",   source: "content" },
  { name: "IG Qualified Followers",  field: "qualifiedFollowerGrowth",   category: "organic",   categoryLabel: "Organic",     displayAs: "number",   source: "content" },
  { name: "IG Organic Reach",        field: "organicReach",              category: "organic",   categoryLabel: "Organic",     displayAs: "number",   source: "content" },
  // Business
  { name: "Business Expenses",       field: "businessExpenses",          category: "business",  categoryLabel: "Business",    displayAs: "currency", source: "dataentry" },
]

const CATEGORY_COLORS: Record<string, string> = {
  sales:     "bg-blue-500/10 text-blue-400 border-0",
  ads_funnel: "bg-orange-500/10 text-orange-400 border-0",
  organic:   "bg-emerald-500/10 text-emerald-400 border-0",
  business:  "bg-purple-500/10 text-purple-400 border-0",
}

function formatValue(value: number, displayAs: "number" | "currency"): string {
  if (displayAs === "currency")
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export function StandardMetricsTable({
  deSums,
  contentSums,
}: {
  deSums: Record<string, number>
  contentSums: Record<string, number>
}) {
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return STANDARD_METRICS.filter((m) => {
      if (categoryFilter !== "all" && m.category !== categoryFilter) return false
      if (search.trim() && !m.name.toLowerCase().includes(search.trim().toLowerCase())) return false
      return true
    })
  }, [categoryFilter, search])

  function getValue(m: StandardMetric): number {
    const sums = m.source === "content" ? contentSums : deSums
    return sums[m.field] ?? 0
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="ads_funnel">Ads + Funnel</SelectItem>
            <SelectItem value="organic">Organic</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Search metrics…"
          className="max-w-[220px] h-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="font-semibold text-foreground">Metric Name</TableHead>
              <TableHead className="font-semibold text-foreground">Category</TableHead>
              <TableHead className="font-semibold text-foreground">Type</TableHead>
              <TableHead className="font-semibold text-foreground">Value (This Month)</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.field} className="border-border">
                <TableCell className="font-medium text-foreground">{m.name}</TableCell>
                <TableCell>
                  <Badge className={CATEGORY_COLORS[m.category] ?? "bg-muted text-muted-foreground border-0"}>
                    {m.categoryLabel}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {m.displayAs === "currency" ? "Currency" : "Number"}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {formatValue(getValue(m), m.displayAs)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground/50"
                    title="Standard metrics cannot be edited"
                  >
                    <Lock className="h-3 w-3" />
                    Standard
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

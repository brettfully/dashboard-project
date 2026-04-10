"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp, Megaphone, Leaf, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SingleDatePicker } from "@/components/ui/single-date-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AccordionSection } from "@/components/ui/accordion-section"

type CustomMetricDef = { id: string; name: string; type: string; category: string; productIds: string[] }

interface ManagerFormProps {
  products: { id: string; name: string }[]
  userId: string
  orgId: string
  customMetrics: CustomMetricDef[]
}

// ── Sales ─────────────────────────────────────────────────────────────────────
const PROSPECTING_FIELDS = [
  { name: "dials", label: "Dials", currency: false },
  { name: "outboundMessages", label: "Outbound Messages", currency: false },
  { name: "inboundMessages", label: "Inbound Messages", currency: false },
  { name: "followUps", label: "Follow-ups", currency: false },
  { name: "setsBooked", label: "Sets Booked", currency: false },
]

const CALLS_FIELDS = [
  { name: "callsToday", label: "Calls Today", currency: false },
  { name: "showCalls",  label: "Show Calls",  currency: false },
  { name: "offersMade", label: "Offers Made", currency: false },
  { name: "dealsWon",   label: "Closes Today", currency: false },
]

const REVENUE_FIELDS = [
  { name: "cashCollected", label: "Cash Collected ($)", currency: true },
  { name: "revenueGenerated", label: "Revenue ($)", currency: true },
  { name: "refunds", label: "Refunds ($)", currency: true },
  { name: "monthlyRecurringRevenue", label: "MRR Collected ($)", currency: true },
  { name: "lowTicketCustomers", label: "Low-Ticket Customers", currency: false },
  { name: "customersCanceled", label: "Customers Canceled", currency: false },
]

// ── Ads + Funnel (DataEntry) ───────────────────────────────────────────────
const ADS_FIELDS = [
  { name: "adSpend", label: "Ad Spend ($)", currency: true },
  { name: "highTicketLandingPageViews", label: "HT LP Views", currency: false },
  { name: "lowTicketLandingPageViews", label: "LT LP Views", currency: false },
]

// emailOptIns lives in ContentMetric but is displayed here; submitted separately
const OPT_INS_FIELD = { name: "emailOptIns", label: "Opt-ins", currency: false }

// ── Organic (ContentMetric) ────────────────────────────────────────────────
const ORGANIC_FIELDS = [
  { name: "youtubeGrowth", label: "YouTube Growth", currency: false },
  { name: "instagramGrowth", label: "IG Growth", currency: false },
  { name: "qualifiedFollowerGrowth", label: "IG Qualified Follower Growth", currency: false },
  { name: "organicReach", label: "IG Organic Reach", currency: false },
]

// ── Business (DataEntry) ───────────────────────────────────────────────────
const BUSINESS_FIELDS = [
  { name: "businessExpenses", label: "Business Expenses ($)", currency: true },
]

// All DataEntry fields (submitted to /api/entries)
const DATA_ENTRY_FIELDS = [
  ...PROSPECTING_FIELDS,
  ...CALLS_FIELDS,
  ...REVENUE_FIELDS,
  ...ADS_FIELDS,
  ...BUSINESS_FIELDS,
]

// All ContentMetric fields (submitted to /api/content-metrics)
const CONTENT_METRIC_FIELDS = [...ORGANIC_FIELDS, OPT_INS_FIELD]

function parseField(value: string, currency: boolean) {
  return currency ? parseFloat(value ?? "0") || 0 : parseInt(value ?? "0") || 0
}

export default function ManagerForm({ products, userId, orgId, customMetrics }: ManagerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [productId, setProductId] = useState("")
  const [date, setDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  })
  const [fields, setFields] = useState<Record<string, string>>({})

  function handleChange(name: string, value: string) {
    setFields((prev) => ({ ...prev, [name]: value }))
  }

  function fieldInput(field: { name: string; label: string; currency: boolean }) {
    return (
      <div key={field.name} className="space-y-1">
        <Label className="text-xs text-muted-foreground">{field.label}</Label>
        <Input
          type="number"
          value={fields[field.name] ?? ""}
          onChange={(e) => handleChange(field.name, e.target.value)}
          placeholder={field.currency ? "0.00" : "0"}
          min="0"
          step={field.currency ? "0.01" : "1"}
        />
      </div>
    )
  }

  const activeCustomMetrics = customMetrics.filter(
    (m) => m.productIds.length === 0 || m.productIds.includes(productId)
  )
  const cmByCategory = (cat: string) => activeCustomMetrics.filter((m) => m.category === cat)

  function customMetricInputs(cat: string) {
    const metrics = cmByCategory(cat)
    if (metrics.length === 0) return null
    return (
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Custom</h3>
        <div className="space-y-3">
          {metrics.map((m) => (
            <div key={m.id} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{m.name}</Label>
              <Input
                type="number"
                value={fields[`cm_${m.id}`] ?? ""}
                onChange={(e) => handleChange(`cm_${m.id}`, e.target.value)}
                placeholder={m.type === "CURRENCY" ? "0.00" : "0"}
                min="0"
                step={m.type === "CURRENCY" ? "0.01" : "1"}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productId) {
      setError("Please select an offer.")
      return
    }
    setLoading(true)
    setSuccess(false)
    setError("")

    const dataEntryPayload = {
      userId,
      organizationId: orgId,
      productId,
      date,
      ...Object.fromEntries(DATA_ENTRY_FIELDS.map((f) => [f.name, parseField(fields[f.name] ?? "0", f.currency)])),
    }

    const contentValues = CONTENT_METRIC_FIELDS.map((f) => parseField(fields[f.name] ?? "0", f.currency))
    const hasContentData = contentValues.some((v) => v !== 0)

    const requests: Promise<Response>[] = [
      fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataEntryPayload),
      }),
    ]

    if (hasContentData) {
      const contentPayload = {
        date,
        ...Object.fromEntries(CONTENT_METRIC_FIELDS.map((f, i) => [f.name, contentValues[i]])),
      }
      requests.push(
        fetch("/api/content-metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contentPayload),
        })
      )
    }

    const customEntries = activeCustomMetrics
      .map((m) => ({ customMetricId: m.id, value: parseFloat(fields[`cm_${m.id}`] ?? "0") || 0 }))
      .filter((e) => e.value !== 0)

    if (customEntries.length > 0) {
      requests.push(
        fetch("/api/custom-metrics/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, productId, entries: customEntries }),
        })
      )
    }

    const results = await Promise.all(requests)
    setLoading(false)

    if (results.every((r) => r.ok)) {
      setSuccess(true)
      setFields({})
      setProductId("")
      router.refresh()
    } else {
      const failed = await Promise.all(results.filter((r) => !r.ok).map((r) => r.json().catch(() => ({}))))
      setError(failed[0]?.error ?? "Failed to submit entry.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Daily Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date + Offer — shared across all sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Date</Label>
              <SingleDatePicker value={date} onChange={setDate} />
            </div>
            <div className="space-y-1">
              <Label>Offer <span className="text-red-500">*</span></Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an offer..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Sales ─────────────────────────────────────────────────────── */}
          <AccordionSection title="Sales" icon={<TrendingUp className="h-4 w-4" />} defaultOpen>
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Prospecting</h3>
                <div className="space-y-3">
                  {PROSPECTING_FIELDS.map(fieldInput)}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Calls</h3>
                <div className="space-y-3">
                  {CALLS_FIELDS.map(fieldInput)}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Revenue</h3>
                <div className="space-y-3">
                  {REVENUE_FIELDS.map(fieldInput)}
                </div>
              </div>

              {customMetricInputs("sales")}
            </div>
          </AccordionSection>

          {/* ── Ads + Funnel ──────────────────────────────────────────────── */}
          <AccordionSection title="Ads + Funnel" icon={<Megaphone className="h-4 w-4" />} defaultOpen={false}>
            <div className="space-y-5">
              <div className="space-y-3">
                {ADS_FIELDS.map(fieldInput)}
                {fieldInput(OPT_INS_FIELD)}
              </div>
              {customMetricInputs("ads_funnel")}
            </div>
          </AccordionSection>

          {/* ── Organic ───────────────────────────────────────────────────── */}
          <AccordionSection title="Organic" icon={<Leaf className="h-4 w-4" />} defaultOpen={false}>
            <div className="space-y-5">
              <div className="space-y-3">
                {ORGANIC_FIELDS.map(fieldInput)}
              </div>
              {customMetricInputs("organic")}
            </div>
          </AccordionSection>

          {/* ── Business ──────────────────────────────────────────────────── */}
          <AccordionSection title="Business" icon={<Briefcase className="h-4 w-4" />} defaultOpen={false}>
            <div className="space-y-5">
              <div className="space-y-3">
                {BUSINESS_FIELDS.map(fieldInput)}
              </div>
              {customMetricInputs("business")}
            </div>
          </AccordionSection>

          <div className="flex items-center gap-4 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Entry"}
            </Button>
            {success && <p className="text-sm text-green-600 font-medium">Entry saved successfully!</p>}
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

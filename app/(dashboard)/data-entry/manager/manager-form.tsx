"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Users, Megaphone, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AccordionSection } from "@/components/ui/accordion-section"

interface ManagerFormProps {
  products: { id: string; name: string }[]
  userId: string
  orgId: string
}

const PROSPECTING_FIELDS = [
  { name: "dials", label: "Dials", currency: false },
  { name: "outboundMessages", label: "Outbound Messages", currency: false },
  { name: "inboundMessages", label: "Inbound Messages", currency: false },
  { name: "followUps", label: "Follow-ups", currency: false },
  { name: "setsBooked", label: "Sets Booked", currency: false },
]

const CLOSING_FIELDS = [
  { name: "callsToday", label: "Calls Today", currency: false },
  { name: "showCalls", label: "Calls Showed", currency: false },
  { name: "offersMade", label: "Offers Presented", currency: false },
  { name: "dealsWon", label: "Calls Closed", currency: false },
]

const REVENUE_FIELDS = [
  { name: "cashCollected", label: "Cash Collected ($)", currency: true },
  { name: "revenueGenerated", label: "Revenue ($)", currency: true },
  { name: "refunds", label: "Refunds ($)", currency: true },
  { name: "monthlyRecurringRevenue", label: "MRR Collected ($)", currency: true },
  { name: "lowTicketCustomers", label: "Low-Ticket Customers", currency: false },
]

const ADS_FUNNEL_FIELDS = [
  { name: "adSpend", label: "Ad Spend ($)", currency: true },
  { name: "highTicketLandingPageViews", label: "High-Ticket LP Views", currency: false },
  { name: "lowTicketLandingPageViews", label: "Low-Ticket LP Views", currency: false },
  { name: "businessExpenses", label: "Business Expenses ($)", currency: true },
  { name: "customersCanceled", label: "Customers Canceled", currency: false },
]

const CONTENT_FIELDS = [
  { name: "youtubeGrowth", label: "YouTube Growth", currency: false },
  { name: "instagramGrowth", label: "Instagram Growth", currency: false },
  { name: "qualifiedFollowerGrowth", label: "Qualified Follower Growth", currency: false },
  { name: "emailOptIns", label: "Email Opt-ins", currency: false },
  { name: "organicReach", label: "Organic Reach", currency: false },
]

function parseField(value: string, currency: boolean) {
  return currency ? parseFloat(value ?? "0") || 0 : parseInt(value ?? "0") || 0
}

export default function ManagerForm({ products, userId, orgId }: ManagerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [productId, setProductId] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [fields, setFields] = useState<Record<string, string>>({})

  function handleChange(name: string, value: string) {
    setFields((prev) => ({ ...prev, [name]: value }))
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
      ...Object.fromEntries([...PROSPECTING_FIELDS, ...CLOSING_FIELDS, ...REVENUE_FIELDS, ...ADS_FUNNEL_FIELDS].map(
        (f) => [f.name, parseField(fields[f.name] ?? "0", f.currency)]
      )),
    }

    const contentValues = CONTENT_FIELDS.map((f) => parseField(fields[f.name] ?? "0", f.currency))
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
        ...Object.fromEntries(CONTENT_FIELDS.map((f, i) => [f.name, contentValues[i]])),
      }
      requests.push(
        fetch("/api/content-metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contentPayload),
        })
      )
    }

    const results = await Promise.all(requests)
    setLoading(false)

    const allOk = results.every((r) => r.ok)
    if (allOk) {
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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

          <AccordionSection title="Sales Entry" icon={<Users className="h-4 w-4" />} defaultOpen>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Prospecting</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {PROSPECTING_FIELDS.map((field) => (
                    <div key={field.name} className="space-y-1">
                      <Label className="text-xs">{field.label}</Label>
                      <Input
                        type="number"
                        value={fields[field.name] ?? ""}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder="0"
                        min="0"
                        step="1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Calls &amp; Closing</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CLOSING_FIELDS.map((field) => (
                    <div key={field.name} className="space-y-1">
                      <Label className="text-xs">{field.label}</Label>
                      <Input
                        type="number"
                        value={fields[field.name] ?? ""}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder="0"
                        min="0"
                        step="1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Revenue</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {REVENUE_FIELDS.map((field) => (
                    <div key={field.name} className="space-y-1">
                      <Label className="text-xs">{field.label}</Label>
                      <Input
                        type="number"
                        value={fields[field.name] ?? ""}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.currency ? "0.00" : "0"}
                        min="0"
                        step={field.currency ? "0.01" : "1"}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="Ads + Funnel" icon={<Megaphone className="h-4 w-4" />} defaultOpen={false}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {ADS_FUNNEL_FIELDS.map((field) => (
                <div key={field.name} className="space-y-1">
                  <Label className="text-xs">{field.label}</Label>
                  <Input
                    type="number"
                    value={fields[field.name] ?? ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.currency ? "0.00" : "0"}
                    min="0"
                    step={field.currency ? "0.01" : "1"}
                  />
                </div>
              ))}
            </div>
          </AccordionSection>

          <AccordionSection title="Content & Organic" icon={<BarChart3 className="h-4 w-4" />} defaultOpen={false}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {CONTENT_FIELDS.map((field) => (
                <div key={field.name} className="space-y-1">
                  <Label className="text-xs">{field.label}</Label>
                  <Input
                    type="number"
                    value={fields[field.name] ?? ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                </div>
              ))}
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

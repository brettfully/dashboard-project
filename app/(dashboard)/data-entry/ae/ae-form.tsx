"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DollarSign } from "lucide-react"
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

type CustomMetricDef = { id: string; name: string; type: string; category: string; productIds: string[] }

interface AeFormProps {
  products: { id: string; name: string }[]
  userId: string
  orgId: string
  customMetrics: CustomMetricDef[]
}

const CALLS_FIELDS = [
  { name: "callsToday", label: "Calls Today", currency: false },
  { name: "dealsWon", label: "Closes Today", currency: false },
]

const REVENUE_FIELDS = [
  { name: "cashCollected", label: "Cash Collected ($)", currency: true },
  { name: "revenueGenerated", label: "Revenue ($)", currency: true },
  { name: "refunds", label: "Refunds ($)", currency: true },
  { name: "monthlyRecurringRevenue", label: "MRR Collected ($)", currency: true },
  { name: "lowTicketCustomers", label: "Low-Ticket Customers", currency: false },
  { name: "customersCanceled", label: "Customers Canceled", currency: false },
]

const ALL_FIELDS = [...CALLS_FIELDS, ...REVENUE_FIELDS]

export default function AeForm({ products, userId, orgId, customMetrics }: AeFormProps) {
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

  const activeCustomMetrics = customMetrics.filter(
    (m) => m.productIds.length === 0 || m.productIds.includes(productId)
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productId) {
      setError("Please select an offer.")
      return
    }
    setLoading(true)
    setSuccess(false)
    setError("")

    const payload = {
      userId,
      organizationId: orgId,
      productId,
      date,
      ...Object.fromEntries(
        ALL_FIELDS.map((f) =>
          f.currency
            ? [f.name, parseFloat(fields[f.name] ?? "0") || 0]
            : [f.name, parseInt(fields[f.name] ?? "0") || 0]
        )
      ),
    }

    const requests: Promise<Response>[] = [
      fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    ]

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
          <div className="space-y-1">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-xs" />
          </div>

          <AccordionSection title="Sales" icon={<DollarSign className="h-4 w-4" />} defaultOpen>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Offer <span className="text-red-500">*</span></Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="Select an offer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Calls</h3>
                <div className="space-y-3">
                  {CALLS_FIELDS.map((field) => (
                    <div key={field.name} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{field.label}</Label>
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
                <div className="space-y-3">
                  {REVENUE_FIELDS.map((field) => (
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
                  ))}
                </div>
              </div>

              {activeCustomMetrics.filter((m) => m.category === "sales").length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Custom</h3>
                  <div className="space-y-3">
                    {activeCustomMetrics.filter((m) => m.category === "sales").map((m) => (
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
              )}
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

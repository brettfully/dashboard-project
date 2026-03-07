"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

interface DataEntryFormProps {
  products: { id: string; name: string }[]
  customMetrics: { id: string; name: string }[]
  userId: string
  orgId: string
}

const METRIC_FIELDS = [
  { name: "scheduledCalls", label: "Scheduled Calls", type: "integer" },
  { name: "openMessages", label: "Open Messages", type: "integer" },
  { name: "showCalls", label: "Show Calls", type: "integer" },
  { name: "offersMade", label: "Offers Made", type: "integer" },
  { name: "dealsWon", label: "Deals Won", type: "integer" },
  { name: "revenueGenerated", label: "Revenue Generated ($)", type: "currency" },
  { name: "cashCollected", label: "Cash Collected ($)", type: "currency" },
  { name: "refunds", label: "Refunds ($)", type: "currency" },
  { name: "adSpend", label: "Ad Spend ($)", type: "currency" },
]

export default function DataEntryForm({ products, customMetrics, userId, orgId }: DataEntryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [productId, setProductId] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [metrics, setMetrics] = useState<Record<string, string>>({})
  const [customValues, setCustomValues] = useState<Record<string, string>>({})

  function handleMetricChange(name: string, value: string) {
    setMetrics((prev) => ({ ...prev, [name]: value }))
  }

  function handleCustomChange(id: string, value: string) {
    setCustomValues((prev) => ({ ...prev, [id]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    const payload = {
      userId,
      organizationId: orgId,
      productId: productId || null,
      date,
      ...Object.fromEntries(
        METRIC_FIELDS.map((f) => [f.name, parseFloat(metrics[f.name] ?? "0") || 0])
      ),
      customMetricEntries: Object.entries(customValues).map(([id, value]) => ({
        customMetricId: id,
        value: parseFloat(value) || 0,
      })),
    }

    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    setLoading(false)
    if (res.ok) {
      setSuccess(true)
      setMetrics({})
      setCustomValues({})
      setProductId("")
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Daily Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Product / Offer (optional)</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific product</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Sales Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {METRIC_FIELDS.map((field) => (
                <div key={field.name} className="space-y-1">
                  <Label className="text-xs">{field.label}</Label>
                  <Input
                    type="number"
                    value={metrics[field.name] ?? ""}
                    onChange={(e) => handleMetricChange(field.name, e.target.value)}
                    placeholder="0"
                    min="0"
                    step={field.type === "currency" ? "0.01" : "1"}
                  />
                </div>
              ))}
            </div>
          </div>

          {customMetrics.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Custom Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {customMetrics.map((metric) => (
                  <div key={metric.id} className="space-y-1">
                    <Label className="text-xs">{metric.name}</Label>
                    <Input
                      type="number"
                      value={customValues[metric.id] ?? ""}
                      onChange={(e) => handleCustomChange(metric.id, e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Entry"}
            </Button>
            {success && (
              <p className="text-sm text-green-600 font-medium">Entry saved successfully!</p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

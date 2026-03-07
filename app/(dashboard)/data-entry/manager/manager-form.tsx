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

interface ManagerFormProps {
  products: { id: string; name: string }[]
  userId: string
  orgId: string
}

const SECTIONS = [
  {
    title: "Prospecting",
    fields: [
      { name: "dials", label: "Dials", currency: false },
      { name: "outboundMessages", label: "Outbound Messages", currency: false },
      { name: "inboundMessages", label: "Inbound Messages", currency: false },
      { name: "followUps", label: "Follow-ups", currency: false },
      { name: "setsBooked", label: "Sets Booked", currency: false },
    ],
  },
  {
    title: "Calls & Closing",
    fields: [
      { name: "callsToday", label: "Calls Today", currency: false },
      { name: "showCalls", label: "Calls Showed", currency: false },
      { name: "offersMade", label: "Offers Presented", currency: false },
      { name: "dealsWon", label: "Calls Closed", currency: false },
    ],
  },
  {
    title: "Revenue",
    fields: [
      { name: "cashCollected", label: "Cash Collected ($)", currency: true },
      { name: "revenueGenerated", label: "Revenue ($)", currency: true },
      { name: "refunds", label: "Refunds ($)", currency: true },
      { name: "monthlyRecurringRevenue", label: "MRR Collected ($)", currency: true },
      { name: "lowTicketCustomers", label: "Low-Ticket Customers", currency: false },
    ],
  },
  {
    title: "Marketing",
    fields: [
      { name: "adSpend", label: "Ad Spend ($)", currency: true },
      { name: "highTicketLandingPageViews", label: "High-Ticket LP Views", currency: false },
      { name: "lowTicketLandingPageViews", label: "Low-Ticket LP Views", currency: false },
    ],
  },
  {
    title: "Business",
    fields: [
      { name: "businessExpenses", label: "Business Expenses ($)", currency: true },
      { name: "customersCanceled", label: "Customers Canceled", currency: false },
    ],
  },
]

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

    const allFields = SECTIONS.flatMap((s) => s.fields)
    const payload = {
      userId,
      organizationId: orgId,
      productId,
      date,
      ...Object.fromEntries(
        allFields.map((f) =>
          f.currency
            ? [f.name, parseFloat(fields[f.name] ?? "0") || 0]
            : [f.name, parseInt(fields[f.name] ?? "0") || 0]
        )
      ),
    }

    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    setLoading(false)
    if (res.ok) {
      setSuccess(true)
      setFields({})
      setProductId("")
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to submit entry.")
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

          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {section.title}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {section.fields.map((field) => (
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
          ))}

          <div className="flex items-center gap-4">
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

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp } from "lucide-react"
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

interface SdrFormProps {
  products: { id: string; name: string }[]
  userId: string
  orgId: string
}

const PROSPECTING_FIELDS = [
  { name: "dials", label: "Dials" },
  { name: "outboundMessages", label: "Outbound Messages" },
  { name: "inboundMessages", label: "Inbound Messages" },
  { name: "followUps", label: "Follow-ups" },
  { name: "setsBooked", label: "Sets Booked" },
]

export default function SdrForm({ products, userId, orgId }: SdrFormProps) {
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

    const payload = {
      userId,
      organizationId: orgId,
      productId,
      date,
      ...Object.fromEntries(PROSPECTING_FIELDS.map((f) => [f.name, parseInt(fields[f.name] ?? "0") || 0])),
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
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Failed to submit entry.")
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

          <AccordionSection title="Sales" icon={<TrendingUp className="h-4 w-4" />} defaultOpen>
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
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Prospecting</h3>
                <div className="space-y-3">
                  {PROSPECTING_FIELDS.map((field) => (
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

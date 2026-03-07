"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const DATA_ENTRY_FIELDS = [
  // Prospecting
  { value: "dials", label: "Dials" },
  { value: "outboundMessages", label: "Outbound Messages" },
  { value: "inboundMessages", label: "Inbound Messages" },
  { value: "followUps", label: "Follow-ups" },
  { value: "setsBooked", label: "Sets Booked" },
  // Calls
  { value: "callsToday", label: "Calls Today" },
  { value: "showCalls", label: "Calls Showed" },
  { value: "offersMade", label: "Offers Presented" },
  { value: "dealsWon", label: "Closes Today" },
  // Revenue
  { value: "cashCollected", label: "Cash Collected" },
  { value: "revenueGenerated", label: "Revenue" },
  { value: "refunds", label: "Refunds" },
  { value: "monthlyRecurringRevenue", label: "MRR Collected" },
  { value: "lowTicketCustomers", label: "Low-Ticket Customers" },
  { value: "customersCanceled", label: "Customers Canceled" },
  // Ads + Funnel
  { value: "adSpend", label: "Ad Spend" },
  { value: "highTicketLandingPageViews", label: "HT LP Views" },
  { value: "lowTicketLandingPageViews", label: "LT LP Views" },
  // Business
  { value: "businessExpenses", label: "Business Expenses" },
] as const

const OPERATORS = [
  { value: "add", label: "+ Addition" },
  { value: "subtract", label: "- Subtraction" },
  { value: "multiply", label: "× Multiplication" },
  { value: "divide", label: "÷ Division" },
] as const

const SHOW_RESULT_AS = [
  { value: "number", label: "Number (123.45)" },
  { value: "currency", label: "Currency ($1,234.56)" },
  { value: "percent", label: "Percentage (12.34%)" },
] as const

const ROLES = [
  "Account Executive",
  "Sales Manager",
  "SDR",
  "Company Admin",
] as const

const CATEGORIES = [
  { value: "sales",     label: "Sales" },
  { value: "ads_funnel", label: "Ads + Funnel" },
  { value: "organic",  label: "Organic" },
  { value: "business", label: "Business" },
] as const

const TYPES = [
  { value: "NUMBER", label: "Number" },
  { value: "CURRENCY", label: "Currency" },
  { value: "CALCULATED", label: "Calculated" },
] as const

type MetricRow = {
  id: string
  name: string
  type: string
  category: string
  role: string | null
  status: string
  productIds: unknown
  firstField: string | null
  operator: string | null
  secondField: string | null
  showResultAs: string | null
}

type Product = { id: string; name: string }

function formatPreviewValue(
  val: number,
  showResultAs: string
): string {
  if (showResultAs === "currency")
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val)
  if (showResultAs === "percent") return `${val.toFixed(1)}%`
  return String(val)
}

export function MetricFormDialog({
  open,
  onOpenChange,
  metric,
  products,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  metric: MetricRow | null
  products: Product[]
  onSuccess: () => void
}) {
  const isEdit = !!metric
  const [name, setName] = useState("")
  const [productIds, setProductIds] = useState<string[]>([])
  const [role, setRole] = useState("Account Executive")
  const [category, setCategory] = useState("sales")
  const [type, setType] = useState<"NUMBER" | "CURRENCY" | "CALCULATED">("NUMBER")
  const [firstField, setFirstField] = useState("revenueGenerated")
  const [operator, setOperator] = useState("subtract")
  const [secondField, setSecondField] = useState("refunds")
  const [showResultAs, setShowResultAs] = useState("number")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    if (metric) {
      setName(metric.name)
      setProductIds(Array.isArray(metric.productIds) ? (metric.productIds as string[]) : [])
      setRole(metric.role ?? "Account Executive")
      setCategory(metric.category ?? "sales")
      setType((metric.type as "NUMBER" | "CURRENCY" | "CALCULATED") || "NUMBER")
      setFirstField(metric.firstField ?? "revenueGenerated")
      setOperator(metric.operator ?? "subtract")
      setSecondField(metric.secondField ?? "refunds")
      setShowResultAs(metric.showResultAs ?? "number")
    } else {
      setName("")
      setProductIds([])
      setRole("Account Executive")
      setCategory("sales")
      setType("NUMBER")
      setFirstField("revenueGenerated")
      setOperator("subtract")
      setSecondField("refunds")
      setShowResultAs("number")
    }
  }, [open, metric])

  const addProduct = (id: string) => {
    if (!productIds.includes(id)) setProductIds([...productIds, id])
  }

  const removeProduct = (id: string) => {
    setProductIds(productIds.filter((p) => p !== id))
  }

  const previewVal1: number = 100
  const previewVal2: number = 25
  const previewResult =
    operator === "add"
      ? previewVal1 + previewVal2
      : operator === "subtract"
        ? previewVal1 - previewVal2
        : operator === "multiply"
          ? previewVal1 * previewVal2
          : previewVal2 !== 0
            ? previewVal1 / previewVal2
            : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit && metric) {
        await fetch(`/api/custom-metrics/${metric.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            productIds,
            role,
            category,
            type,
            firstField: type === "CALCULATED" ? firstField : null,
            operator: type === "CALCULATED" ? operator : null,
            secondField: type === "CALCULATED" ? secondField : null,
            showResultAs: type === "CALCULATED" ? showResultAs : null,
          }),
        })
      } else {
        await fetch("/api/custom-metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            productIds,
            role,
            category,
            type,
            firstField: type === "CALCULATED" ? firstField : null,
            operator: type === "CALCULATED" ? operator : null,
            secondField: type === "CALCULATED" ? secondField : null,
            showResultAs: type === "CALCULATED" ? showResultAs : null,
          }),
        })
      }
      onSuccess()
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Metric" : "Add New Metric"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metric-name">Metric Name</Label>
            <Input
              id="metric-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Net Revenue"
              required
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label>Select Product(s)</Label>
            <div className="flex flex-wrap gap-2 min-h-10 p-2 rounded-md border border-input bg-background">
              {productIds.map((id) => {
                const p = products.find((x) => x.id === id)
                if (!p) return null
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                  >
                    {p.name}
                    <button
                      type="button"
                      onClick={() => removeProduct(id)}
                      className="rounded p-0.5 hover:bg-muted-foreground/20"
                      aria-label={`Remove ${p.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )
              })}
              <Select
                key={productIds.join(",")}
                onValueChange={(id) => {
                  addProduct(id)
                }}
              >
                <SelectTrigger className="w-[180px] h-8 border-0 bg-transparent shadow-none focus:ring-0">
                  <SelectValue placeholder="Add product..." />
                </SelectTrigger>
                <SelectContent>
                  {products
                    .filter((p) => !productIds.includes(p.id))
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "CALCULATED" && (
            <>
              <div className="space-y-2">
                <Label>First Field</Label>
                <Select value={firstField} onValueChange={setFirstField}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_ENTRY_FIELDS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Operator</Label>
                <Select value={operator} onValueChange={setOperator}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Second Field</Label>
                <Select value={secondField} onValueChange={setSecondField}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_ENTRY_FIELDS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select Result Format</Label>
                <Select value={showResultAs} onValueChange={setShowResultAs}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHOW_RESULT_AS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div
                className={cn(
                  "rounded-lg p-4 bg-primary/10 border border-primary/20"
                )}
              >
                <p className="text-sm font-medium text-foreground mb-1">Preview</p>
                <p className="text-sm text-muted-foreground">
                  If Field 1 = {previewVal1} and Field 2 = {previewVal2}, result
                  would be: {formatPreviewValue(previewResult, showResultAs)}
                </p>
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : isEdit ? "Update Metric" : "Add Metric"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

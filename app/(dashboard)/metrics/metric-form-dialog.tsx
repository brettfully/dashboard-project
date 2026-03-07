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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const DATA_ENTRY_FIELDS = [
  // Prospecting
  { group: "Prospecting", value: "dials", label: "Dials" },
  { group: "Prospecting", value: "outboundMessages", label: "Outbound Messages" },
  { group: "Prospecting", value: "inboundMessages", label: "Inbound Messages" },
  { group: "Prospecting", value: "followUps", label: "Follow-ups" },
  { group: "Prospecting", value: "setsBooked", label: "Sets Booked" },
  // Calls
  { group: "Calls", value: "callsToday", label: "Calls Today" },
  { group: "Calls", value: "showCalls", label: "Calls Showed" },
  { group: "Calls", value: "offersMade", label: "Offers Presented" },
  { group: "Calls", value: "dealsWon", label: "Closes Today" },
  // Revenue
  { group: "Revenue", value: "cashCollected", label: "Cash Collected" },
  { group: "Revenue", value: "revenueGenerated", label: "Revenue Generated" },
  { group: "Revenue", value: "refunds", label: "Refunds" },
  { group: "Revenue", value: "monthlyRecurringRevenue", label: "MRR Collected" },
  { group: "Revenue", value: "lowTicketCustomers", label: "Low-Ticket Customers" },
  { group: "Revenue", value: "customersCanceled", label: "Customers Canceled" },
  // Ads + Funnel
  { group: "Ads + Funnel", value: "adSpend", label: "Ad Spend" },
  { group: "Ads + Funnel", value: "highTicketLandingPageViews", label: "HT LP Views" },
  { group: "Ads + Funnel", value: "lowTicketLandingPageViews", label: "LT LP Views" },
  // Business
  { group: "Business", value: "businessExpenses", label: "Business Expenses" },
]

const FIELD_GROUPS = ["Prospecting", "Calls", "Revenue", "Ads + Funnel", "Business"]

const OPERATORS = [
  { value: "add",      symbol: "+", label: "Addition" },
  { value: "subtract", symbol: "−", label: "Subtraction" },
  { value: "multiply", symbol: "×", label: "Multiplication" },
  { value: "divide",   symbol: "÷", label: "Division" },
] as const

const SHOW_RESULT_AS = [
  { value: "number",   label: "Number",     example: "1,234" },
  { value: "currency", label: "Currency",   example: "$1,234.56" },
  { value: "percent",  label: "Percentage", example: "12.34%" },
] as const

const ROLES = [
  { value: "Account Executive", label: "Account Executive" },
  { value: "Sales Manager",     label: "Sales Manager" },
  { value: "SDR",               label: "SDR" },
  { value: "Company Admin",     label: "Company Admin" },
] as const

const CATEGORIES = [
  { value: "sales",     label: "Sales" },
  { value: "ads_funnel", label: "Ads + Funnel" },
  { value: "organic",  label: "Organic" },
  { value: "business", label: "Business" },
] as const

const TYPES = [
  {
    value: "CALCULATED",
    label: "Calculated Formula",
    desc: "Derive a result from two existing fields using a formula",
  },
  {
    value: "NUMBER",
    label: "Tracked Number",
    desc: "Manually enter an integer value in data entry",
  },
  {
    value: "CURRENCY",
    label: "Tracked Currency",
    desc: "Manually enter a dollar amount in data entry",
  },
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

function fieldLabel(fieldValue: string): string {
  return DATA_ENTRY_FIELDS.find((f) => f.value === fieldValue)?.label ?? fieldValue
}

function formatPreviewValue(val: number, showResultAs: string): string {
  if (showResultAs === "currency")
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val)
  if (showResultAs === "percent") return `${val.toFixed(2)}%`
  return Number.isInteger(val) ? String(val) : val.toFixed(2)
}

function FieldSelect({
  value,
  onChange,
  exclude,
}: {
  value: string
  onChange: (v: string) => void
  exclude?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-background border-border">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {FIELD_GROUPS.map((group) => {
          const fields = DATA_ENTRY_FIELDS.filter(
            (f) => f.group === group && f.value !== exclude
          )
          if (fields.length === 0) return null
          return (
            <SelectGroup key={group}>
              <SelectLabel>{group}</SelectLabel>
              {fields.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectGroup>
          )
        })}
      </SelectContent>
    </Select>
  )
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
  const [type, setType] = useState<"NUMBER" | "CURRENCY" | "CALCULATED">("CALCULATED")
  const [firstField, setFirstField] = useState("revenueGenerated")
  const [operator, setOperator] = useState("subtract")
  const [secondField, setSecondField] = useState("refunds")
  const [showResultAs, setShowResultAs] = useState("currency")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    if (metric) {
      setName(metric.name)
      setProductIds(Array.isArray(metric.productIds) ? (metric.productIds as string[]) : [])
      setRole(metric.role ?? "Account Executive")
      setCategory(metric.category ?? "sales")
      setType((metric.type as "NUMBER" | "CURRENCY" | "CALCULATED") || "CALCULATED")
      setFirstField(metric.firstField ?? "revenueGenerated")
      setOperator(metric.operator ?? "subtract")
      setSecondField(metric.secondField ?? "refunds")
      setShowResultAs(metric.showResultAs ?? "currency")
    } else {
      setName("")
      setProductIds([])
      setRole("Account Executive")
      setCategory("sales")
      setType("CALCULATED")
      setFirstField("revenueGenerated")
      setOperator("subtract")
      setSecondField("refunds")
      setShowResultAs("currency")
    }
  }, [open, metric])

  const addProduct = (id: string) => {
    if (!productIds.includes(id)) setProductIds([...productIds, id])
  }

  const removeProduct = (id: string) => {
    setProductIds(productIds.filter((p) => p !== id))
  }

  // Live preview calculation
  const previewA: number = 1000
  const previewB: number = 250
  const previewResult: number | null =
    operator === "add" ? previewA + previewB
    : operator === "subtract" ? previewA - previewB
    : operator === "multiply" ? previewA * previewB
    : previewB !== 0 ? previewA / previewB : null

  const opSymbol = OPERATORS.find((o) => o.value === operator)?.symbol ?? "?"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const body = {
        name,
        productIds,
        role,
        category,
        type,
        firstField: type === "CALCULATED" ? firstField : null,
        operator: type === "CALCULATED" ? operator : null,
        secondField: type === "CALCULATED" ? secondField : null,
        showResultAs: type === "CALCULATED" ? showResultAs : null,
      }
      if (isEdit && metric) {
        await fetch(`/api/custom-metrics/${metric.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      } else {
        await fetch("/api/custom-metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
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

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 1. Metric Name */}
          <div className="space-y-1.5">
            <Label htmlFor="metric-name">Metric Name</Label>
            <Input
              id="metric-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cost Per Booked Call, Net Revenue, ROAS…"
              required
            />
          </div>

          {/* 2. Products */}
          <div className="space-y-1.5">
            <Label>
              Select Product(s)
              <span className="ml-1 text-xs text-muted-foreground font-normal">(leave empty for all products)</span>
            </Label>
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
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )
              })}
              <Select key={productIds.join(",")} onValueChange={addProduct}>
                <SelectTrigger className="w-[160px] h-8 border-0 bg-transparent shadow-none focus:ring-0">
                  <SelectValue placeholder="Add product…" />
                </SelectTrigger>
                <SelectContent>
                  {products
                    .filter((p) => !productIds.includes(p.id))
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3 & 4. Role + Category side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 5. Type — card style selector */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="grid grid-cols-1 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value as typeof type)}
                  className={cn(
                    "text-left px-3 py-2.5 rounded-lg border transition-colors",
                    type === t.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-muted-foreground/40"
                  )}
                >
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Formula Builder — only for CALCULATED */}
          {type === "CALCULATED" && (
            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Formula Builder
              </p>

              {/* Visual formula: [Field 1] [op] [Field 2] */}
              <div className="space-y-3">
                {/* First Field */}
                <div className="space-y-1.5">
                  <Label className="text-xs">First Field</Label>
                  <FieldSelect
                    value={firstField}
                    onChange={setFirstField}
                    exclude={secondField}
                  />
                </div>

                {/* Operator — button group */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Operation</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {OPERATORS.map((op) => (
                      <button
                        key={op.value}
                        type="button"
                        onClick={() => setOperator(op.value)}
                        className={cn(
                          "flex flex-col items-center justify-center py-2.5 rounded-lg border text-sm font-semibold transition-colors",
                          operator === op.value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-muted-foreground/40 text-foreground"
                        )}
                      >
                        <span className="text-lg leading-none">{op.symbol}</span>
                        <span className="text-[10px] font-normal text-current opacity-70 mt-0.5">{op.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Second Field */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Second Field</Label>
                  <FieldSelect
                    value={secondField}
                    onChange={setSecondField}
                    exclude={firstField}
                  />
                </div>
              </div>

              {/* Live formula display */}
              <div className="flex items-center gap-2 rounded-lg bg-background border border-border px-3 py-2 text-sm">
                <span className="font-medium truncate">{fieldLabel(firstField)}</span>
                <span className="text-primary font-bold text-base flex-shrink-0">{opSymbol}</span>
                <span className="font-medium truncate">{fieldLabel(secondField)}</span>
                <span className="text-muted-foreground flex-shrink-0">=</span>
                <span className="font-semibold text-primary flex-shrink-0">Result</span>
              </div>

              {/* Show Result As */}
              <div className="space-y-1.5">
                <Label className="text-xs">Show Result As</Label>
                <div className="grid grid-cols-3 gap-2">
                  {SHOW_RESULT_AS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setShowResultAs(s.value)}
                      className={cn(
                        "flex flex-col items-center py-2 px-1 rounded-lg border text-center transition-colors",
                        showResultAs === s.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-muted-foreground/40"
                      )}
                    >
                      <span className="text-xs font-semibold">{s.label}</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">{s.example}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-lg bg-primary/8 border border-primary/20 p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Preview</p>
                <div className="flex items-baseline gap-1.5 text-sm">
                  <span className="text-muted-foreground">If</span>
                  <span className="font-medium">{fieldLabel(firstField)}</span>
                  <span className="text-muted-foreground">= {previewA.toLocaleString()}</span>
                  <span className="text-muted-foreground">and</span>
                  <span className="font-medium">{fieldLabel(secondField)}</span>
                  <span className="text-muted-foreground">= {previewB.toLocaleString()}</span>
                </div>
                <div className="flex items-baseline gap-1.5 text-sm mt-1">
                  <span className="text-muted-foreground">Result:</span>
                  <span className="font-bold text-primary text-base">
                    {previewResult !== null
                      ? formatPreviewValue(previewResult, showResultAs)
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
            {loading ? "Saving…" : isEdit ? "Update Metric" : "Add Metric"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

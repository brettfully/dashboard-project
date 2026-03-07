"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"

interface FinancialEntryDialogProps {
  orgId: string
}

export default function FinancialEntryDialog({ orgId }: FinancialEntryDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    businessIncome: "",
    businessExpenses: "",
    preTaxProfit: "",
    netAfterTaxes: "",
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch("/api/financial-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, organizationId: orgId }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Financial Report</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Month / Date</Label>
            <Input type="date" name="date" value={form.date} onChange={handleChange} />
          </div>
          {[
            { name: "businessIncome", label: "Business Income ($)" },
            { name: "businessExpenses", label: "Business Expenses ($)" },
            { name: "preTaxProfit", label: "Pre-Tax Profit ($)" },
            { name: "netAfterTaxes", label: "Net After Taxes ($)" },
          ].map((f) => (
            <div key={f.name} className="space-y-1">
              <Label>{f.label}</Label>
              <Input
                type="number"
                name={f.name}
                value={form[f.name as keyof typeof form]}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
              />
            </div>
          ))}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Report"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

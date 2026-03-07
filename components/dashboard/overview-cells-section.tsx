"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { KpiCard } from "@/components/charts/kpi-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, X, Activity } from "lucide-react"

export type CellOption = {
  value: string
  label: string
  source: "standard" | "custom"
  displayAs: "currency" | "number" | "percent"
}

type SavedCell = {
  id: string
  label: string
  displayAs: string
  computedValue: number | null
}

function formatValue(value: number | null, displayAs: string): string {
  if (value === null || value === undefined) return "—"
  if (displayAs === "currency")
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
  if (displayAs === "percent") return `${value.toFixed(1)}%`
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export function OverviewCellsSection({
  cells,
  options,
}: {
  cells: SavedCell[]
  options: CellOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState("")
  const [cellLabel, setCellLabel] = useState("")
  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  function handleSelect(val: string) {
    setSelected(val)
    const opt = options.find((o) => o.value === val)
    if (opt) setCellLabel(opt.label)
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) {
      setSelected("")
      setCellLabel("")
    }
  }

  async function handleAdd() {
    if (!selected || !cellLabel.trim()) return
    const opt = options.find((o) => o.value === selected)!
    setLoading(true)
    await fetch("/api/overview-cells", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: cellLabel.trim(),
        source: opt.source,
        fieldName: opt.value,
        displayAs: opt.displayAs,
      }),
    })
    setLoading(false)
    handleOpenChange(false)
    router.refresh()
  }

  async function handleRemove(id: string) {
    setRemoving(id)
    await fetch(`/api/overview-cells/${id}`, { method: "DELETE" })
    setRemoving(null)
    router.refresh()
  }

  const standardOptions = options.filter((o) => o.source === "standard")
  const customOptions = options.filter((o) => o.source === "custom")

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {cells.map((cell) => (
          <div key={cell.id} className="relative group">
            <KpiCard
              title={cell.label}
              value={formatValue(cell.computedValue, cell.displayAs)}
              icon={Activity}
            />
            <button
              onClick={() => handleRemove(cell.id)}
              disabled={removing === cell.id}
              className="absolute top-2 left-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove cell"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <button
          onClick={() => setOpen(true)}
          className="rounded-2xl border-2 border-dashed border-border/40 min-h-[120px] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs font-medium">Add Cell</span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Overview Cell</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label>Metric</Label>
              <Select value={selected} onValueChange={handleSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a metric..." />
                </SelectTrigger>
                <SelectContent>
                  {standardOptions.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Standard Fields</SelectLabel>
                      {standardOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {customOptions.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Custom Metrics</SelectLabel>
                      {customOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Display Label</Label>
              <Input
                value={cellLabel}
                onChange={(e) => setCellLabel(e.target.value)}
                placeholder="e.g. Sets Booked"
              />
            </div>

            <Button
              className="w-full"
              disabled={!selected || !cellLabel.trim() || loading}
              onClick={handleAdd}
            >
              {loading ? "Adding..." : "Add Cell"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

"use client"

import { useState, useRef } from "react"
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
import { Activity, Settings2, Plus, Trash2, ChevronDown, X } from "lucide-react"

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

type DashboardView = {
  id: string
  name: string
  isDefault: boolean
}

function formatValue(value: number | null, displayAs: string): string {
  if (value === null || value === undefined) return "—"
  if (displayAs === "currency")
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
  if (displayAs === "percent") return `${value.toFixed(1)}%`
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export function DashboardCustomizer({
  views,
  activeViewId,
  cells,
  options,
}: {
  views: DashboardView[]
  activeViewId: string | null
  cells: SavedCell[]
  options: CellOption[]
}) {
  const router = useRouter()

  // Customize panel state
  const [custOpen, setCustOpen] = useState(false)
  const [selected, setSelected] = useState("")
  const [cellLabel, setCellLabel] = useState("")
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  // View management state
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const [newViewDialogOpen, setNewViewDialogOpen] = useState(false)
  const [newViewName, setNewViewName] = useState("")
  const [creatingView, setCreatingView] = useState(false)

  // Drag and drop state
  const [orderedCells, setOrderedCells] = useState<SavedCell[]>(cells)
  const [dragId, setDragId] = useState<string | null>(null)
  const dragOver = useRef<string | null>(null)

  // Keep orderedCells in sync when cells prop changes
  const prevCellIds = useRef(cells.map((c) => c.id).join(","))
  const currCellIds = cells.map((c) => c.id).join(",")
  if (prevCellIds.current !== currCellIds) {
    prevCellIds.current = currCellIds
    setOrderedCells(cells)
  }

  function handleSelectMetric(val: string) {
    setSelected(val)
    const opt = options.find((o) => o.value === val)
    if (opt) setCellLabel(opt.label)
  }

  async function handleAddCell() {
    if (!selected || !cellLabel.trim()) return
    const opt = options.find((o) => o.value === selected)!
    setAdding(true)
    await fetch("/api/overview-cells", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        viewId: activeViewId,
        label: cellLabel.trim(),
        source: opt.source,
        fieldName: opt.value,
        displayAs: opt.displayAs,
      }),
    })
    setAdding(false)
    setSelected("")
    setCellLabel("")
    router.refresh()
  }

  async function handleRemoveCell(id: string) {
    setRemoving(id)
    await fetch(`/api/overview-cells/${id}`, { method: "DELETE" })
    setRemoving(null)
    router.refresh()
  }

  // Drag and drop handlers
  function handleDragStart(id: string) {
    setDragId(id)
  }

  function handleDragEnter(id: string) {
    dragOver.current = id
    if (dragId && dragId !== id) {
      setOrderedCells((prev) => {
        const arr = [...prev]
        const fromIdx = arr.findIndex((c) => c.id === dragId)
        const toIdx = arr.findIndex((c) => c.id === id)
        if (fromIdx === -1 || toIdx === -1) return prev
        const [moved] = arr.splice(fromIdx, 1)
        arr.splice(toIdx, 0, moved)
        return arr
      })
    }
  }

  async function handleDragEnd() {
    setDragId(null)
    dragOver.current = null
    const order = orderedCells.map((c) => c.id)
    await fetch("/api/overview-cells/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    })
    router.refresh()
  }

  // View management
  async function handleSwitchView(viewId: string) {
    setViewMenuOpen(false)
    const params = new URLSearchParams(window.location.search)
    params.set("view", viewId)
    router.push(`?${params.toString()}`)
  }

  async function handleCreateView() {
    if (!newViewName.trim()) return
    setCreatingView(true)
    const res = await fetch("/api/dashboard-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newViewName.trim() }),
    })
    const view = await res.json()
    setCreatingView(false)
    setNewViewName("")
    setNewViewDialogOpen(false)
    router.push(`?view=${view.id}`)
  }

  async function handleDeleteView(id: string) {
    setViewMenuOpen(false)
    await fetch(`/api/dashboard-views/${id}`, { method: "DELETE" })
    const remaining = views.filter((v) => v.id !== id)
    if (remaining.length > 0) {
      router.push(`?view=${remaining[0].id}`)
    } else {
      router.push("?")
    }
    router.refresh()
  }

  const activeView = views.find((v) => v.id === activeViewId) ?? views[0] ?? null
  const standardOptions = options.filter((o) => o.source === "standard")
  const customOptions = options.filter((o) => o.source === "custom")
  const addedFieldNames = new Set(orderedCells.map((c) => c.label))

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* View selector */}
        <div className="relative">
          <button
            onClick={() => setViewMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            {activeView ? activeView.name : "Default View"}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {viewMenuOpen && (
            <div className="absolute top-full mt-1 left-0 z-50 min-w-[180px] rounded-lg border bg-card shadow-lg overflow-hidden">
              {views.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 cursor-pointer group"
                >
                  <span
                    className={`text-sm flex-1 ${activeViewId === v.id ? "font-semibold text-primary" : ""}`}
                    onClick={() => handleSwitchView(v.id)}
                  >
                    {v.name}
                  </span>
                  {views.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteView(v.id) }}
                      className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 ml-2"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <div className="border-t">
                <button
                  onClick={() => { setViewMenuOpen(false); setNewViewDialogOpen(true) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New View
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Customize Dashboard button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCustOpen(true)}
          className="flex items-center gap-2"
        >
          <Settings2 className="h-4 w-4" />
          Customize Dashboard
        </Button>
      </div>

      {/* Draggable cell grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {orderedCells.map((cell) => (
          <div
            key={cell.id}
            draggable
            onDragStart={() => handleDragStart(cell.id)}
            onDragEnter={() => handleDragEnter(cell.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`relative group cursor-grab active:cursor-grabbing transition-opacity ${dragId === cell.id ? "opacity-40" : "opacity-100"}`}
          >
            <KpiCard
              title={cell.label}
              value={formatValue(cell.computedValue, cell.displayAs)}
              icon={Activity}
            />
            <button
              onClick={() => handleRemoveCell(cell.id)}
              disabled={removing === cell.id}
              className="absolute top-2 left-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove cell"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Customize Dashboard panel */}
      <Dialog open={custOpen} onOpenChange={setCustOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Customize Dashboard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label>Metric</Label>
              <Select value={selected} onValueChange={handleSelectMetric}>
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
              disabled={!selected || !cellLabel.trim() || adding}
              onClick={handleAddCell}
            >
              {adding ? "Adding..." : "Add to Dashboard"}
            </Button>

            {orderedCells.length > 0 && (
              <div className="space-y-1 pt-1 border-t">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide pb-1">Current Cells</p>
                {orderedCells.map((cell) => (
                  <div key={cell.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/40">
                    <span className="text-sm">{cell.label}</span>
                    <button
                      onClick={() => handleRemoveCell(cell.id)}
                      disabled={removing === cell.id}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* New View dialog */}
      <Dialog open={newViewDialogOpen} onOpenChange={setNewViewDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>New View</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label>View Name</Label>
              <Input
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="e.g. Sales Team"
                onKeyDown={(e) => e.key === "Enter" && handleCreateView()}
              />
            </div>
            <Button
              className="w-full"
              disabled={!newViewName.trim() || creatingView}
              onClick={handleCreateView}
            >
              {creatingView ? "Creating..." : "Create View"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SingleDatePicker } from "@/components/ui/single-date-picker"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export interface EntryRow {
  id: string
  date: string | Date
  productId: string | null
  productName: string | null
  setsBooked: number
  dealsWon: number
  cashCollected: number
  revenueGenerated: number
  refunds: number
  adSpend: number
  dials: number
  outboundMessages: number
  inboundMessages: number
  followUps: number
  callsToday: number
  lowTicketCustomers: number
  monthlyRecurringRevenue: number
  customersCanceled: number
  businessExpenses: number
  highTicketLandingPageViews: number
  lowTicketLandingPageViews: number
}

const FIELD_GROUPS = [
  {
    label: "Prospecting",
    fields: [
      { name: "dials",             label: "Dials",              currency: false },
      { name: "outboundMessages",  label: "Outbound Messages",  currency: false },
      { name: "inboundMessages",   label: "Inbound Messages",   currency: false },
      { name: "followUps",         label: "Follow-ups",         currency: false },
      { name: "setsBooked",        label: "Sets Booked",        currency: false },
    ],
  },
  {
    label: "Calls & Closes",
    fields: [
      { name: "callsToday",        label: "Calls Today",        currency: false },
      { name: "dealsWon",          label: "Closes",             currency: false },
    ],
  },
  {
    label: "Revenue",
    fields: [
      { name: "cashCollected",           label: "Cash Collected ($)",   currency: true },
      { name: "revenueGenerated",        label: "Revenue ($)",          currency: true },
      { name: "refunds",                 label: "Refunds ($)",          currency: true },
      { name: "monthlyRecurringRevenue", label: "MRR Collected ($)",    currency: true },
      { name: "lowTicketCustomers",      label: "Low-Ticket Customers", currency: false },
      { name: "customersCanceled",       label: "Customers Canceled",   currency: false },
    ],
  },
  {
    label: "Ads & Funnel",
    fields: [
      { name: "adSpend",                    label: "Ad Spend ($)",   currency: true },
      { name: "highTicketLandingPageViews", label: "HT LP Views",    currency: false },
      { name: "lowTicketLandingPageViews",  label: "LT LP Views",    currency: false },
    ],
  },
  {
    label: "Business",
    fields: [
      { name: "businessExpenses", label: "Business Expenses ($)", currency: true },
    ],
  },
]

function toDateString(d: string | Date): string {
  if (typeof d === "string") return d.split("T")[0]
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function EntryRowActions({ entry }: { entry: EntryRow }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  const [date, setDate] = useState(toDateString(entry.date))
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    FIELD_GROUPS.flatMap((g) => g.fields).forEach((f) => {
      init[f.name] = String((entry as Record<string, unknown>)[f.name] ?? 0)
    })
    return init
  })

  function handleChange(name: string, value: string) {
    setFields((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError("")
    const payload: Record<string, unknown> = {
      date: date + "T12:00:00.000Z",
    }
    FIELD_GROUPS.flatMap((g) => g.fields).forEach((f) => {
      payload[f.name] = f.currency
        ? parseFloat(fields[f.name] ?? "0") || 0
        : parseInt(fields[f.name] ?? "0") || 0
    })

    const res = await fetch(`/api/entries/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (res.ok) {
      setEditOpen(false)
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Failed to save changes.")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/entries/${entry.id}`, { method: "DELETE" })
    setDeleting(false)
    setDeleteOpen(false)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Edit entry"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete entry"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-1">
              <Label>Date</Label>
              <SingleDatePicker value={date} onChange={setDate} />
            </div>

            {FIELD_GROUPS.map((group) => (
              <div key={group.label}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {group.label}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {group.fields.map((f) => (
                    <div key={f.name} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{f.label}</Label>
                      <Input
                        type="number"
                        value={fields[f.name] ?? ""}
                        onChange={(e) => handleChange(f.name, e.target.value)}
                        placeholder={f.currency ? "0.00" : "0"}
                        min="0"
                        step={f.currency ? "0.01" : "1"}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the entry for{" "}
            <span className="font-medium text-foreground">
              {format(parseISO(toDateString(entry.date)), "MMM d, yyyy")}
            </span>
            ? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

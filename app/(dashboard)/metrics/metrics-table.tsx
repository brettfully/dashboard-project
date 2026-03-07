"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"

export type CustomMetricWithUpdatedBy = {
  id: string
  name: string
  type: string
  category: string
  role: string | null
  status: string
  pinnedToOverview: boolean
  updatedAt: Date | null
  updatedById: string | null
  updatedBy: { name: string | null; email: string } | null
  productIds: unknown
  firstField: string | null
  operator: string | null
  secondField: string | null
  showResultAs: string | null
}

/** Derive user-facing type label from type + showResultAs */
function typeLabel(m: CustomMetricWithUpdatedBy): string {
  if (m.type === "CALCULATED") {
    if (m.showResultAs === "currency") return "Currency"
    if (m.showResultAs === "percent") return "Percentage"
    return "Number"
  }
  if (m.type === "CURRENCY") return "Currency"
  return "Number"
}

export function MetricsTable({
  metrics,
  onEdit,
}: {
  metrics: CustomMetricWithUpdatedBy[]
  onEdit: (metric: CustomMetricWithUpdatedBy) => void
}) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<CustomMetricWithUpdatedBy | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    return metrics.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false
      if (roleFilter !== "all" && m.role !== roleFilter) return false
      if (search.trim() && !m.name.toLowerCase().includes(search.trim().toLowerCase()))
        return false
      return true
    })
  }, [metrics, statusFilter, roleFilter, search])

  const roles = useMemo(() => {
    const set = new Set(metrics.map((m) => m.role).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [metrics])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await fetch(`/api/custom-metrics/${deleteTarget.id}`, { method: "DELETE" })
    setDeleting(false)
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Disabled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[190px] h-9">
              <SelectValue placeholder="Filter by Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Search metrics…"
            className="max-w-[220px] h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-semibold text-foreground">Metric Name</TableHead>
                <TableHead className="font-semibold text-foreground">Type</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Role</TableHead>
                <TableHead className="font-semibold text-foreground">Last Updated</TableHead>
                <TableHead className="font-semibold text-foreground text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    {metrics.length === 0
                      ? "No custom metrics yet. Click \"Add New Metric\" to create one."
                      : "No metrics match your filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => (
                  <TableRow key={m.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{m.name}</TableCell>

                    <TableCell className="text-muted-foreground text-sm">
                      {typeLabel(m)}
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={
                          m.status === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-400 border-0"
                            : "bg-muted text-muted-foreground border-0"
                        }
                      >
                        {m.status === "ACTIVE" ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-muted-foreground text-sm">
                      {m.role ?? "—"}
                    </TableCell>

                    <TableCell className="text-muted-foreground text-sm">
                      {m.updatedAt ? format(new Date(m.updatedAt), "MMM d, yyyy") : "—"}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(m)}
                          aria-label="Edit metric"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(m)}
                          aria-label="Delete metric"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Metric</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.name}</span>?
            This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

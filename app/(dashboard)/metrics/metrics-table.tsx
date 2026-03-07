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
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"

export type CustomMetricWithUpdatedBy = {
  id: string
  name: string
  type: string
  role: string | null
  status: string
  updatedAt: Date | null
  updatedById: string | null
  updatedBy: { name: string | null; email: string } | null
  productIds: unknown
  firstField: string | null
  operator: string | null
  secondField: string | null
  showResultAs: string | null
}

type Product = { id: string; name: string }

export function MetricsTable({
  metrics,
  onEdit,
}: {
  metrics: CustomMetricWithUpdatedBy[]
  onEdit: (metric: CustomMetricWithUpdatedBy) => void
}) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState("ACTIVE")
  const [roleFilter, setRoleFilter] = useState("all")
  const [search, setSearch] = useState("")

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

  async function handleDelete(id: string) {
    if (!confirm("Delete this metric? This cannot be undone.")) return
    await fetch(`/api/custom-metrics/${id}`, { method: "DELETE" })
    router.refresh()
  }

  const typeLabel = (t: string) => {
    if (t === "CURRENCY") return "CURRENCY"
    if (t === "CALCULATED") return "CALCULATED"
    return "NUMBER"
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
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="Filter by Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r} value={r}>
                  {r.replace(/_/g, " ")} Metrics
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search metrics by name"
            className="max-w-[240px] h-9"
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
                <TableHead className="font-semibold text-foreground">Updated By</TableHead>
                <TableHead className="font-semibold text-foreground text-right w-[100px]">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No metrics match your filters. Add a new metric above.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => (
                  <TableRow key={m.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{m.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {typeLabel(m.type)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          m.status === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-400 border-0"
                            : "text-muted-foreground"
                        }
                      >
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.role?.replace(/_/g, " ") ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {m.updatedBy?.name ?? "N/A"}
                      {m.updatedAt && (
                        <span className="block text-xs mt-0.5">
                          {format(new Date(m.updatedAt), "MMM d, yyyy h:mm a")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(m)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(m.id)}
                          aria-label="Delete"
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
    </>
  )
}

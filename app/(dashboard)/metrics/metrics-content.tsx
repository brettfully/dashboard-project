"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { MetricsTable, type CustomMetricWithUpdatedBy } from "./metrics-table"
import { MetricFormDialog } from "./metric-form-dialog"

type Product = { id: string; name: string }

export function MetricsContent({
  metrics,
  products,
}: {
  metrics: CustomMetricWithUpdatedBy[]
  products: Product[]
}) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMetric, setEditingMetric] = useState<CustomMetricWithUpdatedBy | null>(null)

  function openAdd() {
    setEditingMetric(null)
    setDialogOpen(true)
  }

  function openEdit(metric: CustomMetricWithUpdatedBy) {
    setEditingMetric(metric)
    setDialogOpen(true)
  }

  function handleSuccess() {
    setDialogOpen(false)
    setEditingMetric(null)
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Button onClick={openAdd} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Metric
        </Button>
        <Button variant="outline" size="sm">
          Set Order
        </Button>
      </div>

      <MetricsTable metrics={metrics} onEdit={openEdit} />

      <MetricFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        metric={editingMetric}
        products={products}
        onSuccess={handleSuccess}
      />
    </>
  )
}

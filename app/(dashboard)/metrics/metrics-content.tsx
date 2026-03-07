"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { MetricsTable, type CustomMetricWithUpdatedBy } from "./metrics-table"
import { MetricFormDialog } from "./metric-form-dialog"
import { StandardMetricsTable } from "./standard-metrics-table"

type Product = { id: string; name: string }

export function MetricsContent({
  metrics,
  products,
  metricValues,
  deSums,
  contentSums,
}: {
  metrics: CustomMetricWithUpdatedBy[]
  products: Product[]
  metricValues: Record<string, number | null>
  deSums: Record<string, number>
  contentSums: Record<string, number>
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
      {/* Standard Metrics — read-only */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Standard Metrics</h2>
          <p className="text-sm text-muted-foreground">Built-in fields tracked across all data entry. Read-only.</p>
        </div>
        <StandardMetricsTable deSums={deSums} contentSums={contentSums} />
      </section>

      {/* Custom Metrics — editable */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Custom Metrics</h2>
            <p className="text-sm text-muted-foreground">Metrics you define — calculated formulas or manually tracked values.</p>
          </div>
          <Button onClick={openAdd} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Metric
          </Button>
        </div>
        <MetricsTable metrics={metrics} onEdit={openEdit} metricValues={metricValues} />
      </section>

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

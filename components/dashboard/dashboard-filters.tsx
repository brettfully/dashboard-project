"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { format, subDays, startOfYear } from "date-fns"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

function presetDates(preset: string): { from: string; to: string } {
  const today = new Date()
  const fmt = (d: Date) => format(d, "yyyy-MM-dd")
  const to = fmt(today)
  switch (preset) {
    case "last7":   return { from: fmt(subDays(today, 7)), to }
    case "last30":  return { from: fmt(subDays(today, 30)), to }
    case "last90":  return { from: fmt(subDays(today, 90)), to }
    case "ytd":     return { from: fmt(startOfYear(today)), to }
    default:        return { from: fmt(subDays(today, 30)), to }
  }
}

interface DashboardFiltersProps {
  className?: string
}

export function DashboardFilters({ className }: DashboardFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const defaultFrom = searchParams.get("from") ?? format(subDays(new Date(), 30), "yyyy-MM-dd")
  const defaultTo   = searchParams.get("to")   ?? format(new Date(), "yyyy-MM-dd")

  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo]     = useState(defaultTo)

  const pushDates = useCallback((nextFrom: string, nextTo: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("from", nextFrom)
    params.set("to", nextTo)
    router.replace(`?${params.toString()}`)
  }, [router, searchParams])

  const handleFromChange = (val: string) => {
    setFrom(val)
    if (val && to) pushDates(val, to)
  }

  const handleToChange = (val: string) => {
    setTo(val)
    if (from && val) pushDates(from, val)
  }

  const handlePreset = (val: string) => {
    const { from: f, to: t } = presetDates(val)
    setFrom(f)
    setTo(t)
    pushDates(f, t)
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Date Range</span>
          <Input
            type="date"
            className="h-9 w-[140px]"
            value={from}
            onChange={(e) => handleFromChange(e.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="date"
            className="h-9 w-[140px]"
            value={to}
            onChange={(e) => handleToChange(e.target.value)}
          />
        </div>
        <Select onValueChange={handlePreset}>
          <SelectTrigger className="w-[220px] h-9">
            <SelectValue placeholder="Quick Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last7">Last 7 days</SelectItem>
            <SelectItem value="last30">Last 30 days</SelectItem>
            <SelectItem value="last90">Last 90 days</SelectItem>
            <SelectItem value="ytd">Year to date</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

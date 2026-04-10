"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { format, subDays, startOfYear, parseISO } from "date-fns"
import type { DateRange } from "react-day-picker"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const PRESETS = [
  { label: "Last 7 days",  value: "last7",  days: 7 },
  { label: "Last 30 days", value: "last30", days: 30 },
  { label: "Last 90 days", value: "last90", days: 90 },
  { label: "Year to date", value: "ytd",    days: 0 },
] as const

function presetDates(preset: string) {
  const today = new Date()
  if (preset === "ytd") return { from: startOfYear(today), to: today }
  const found = PRESETS.find((p) => p.value === preset)
  return { from: subDays(today, found?.days ?? 30), to: today }
}

function DateRangePicker({
  from, to, onSelect,
}: {
  from: Date | undefined
  to: Date | undefined
  onSelect: (range: { from: Date | undefined; to: Date | undefined }) => void
}) {
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState<DateRange>({ from, to })

  const label =
    from && to
      ? `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`
      : from ? `${format(from, "MMM d, yyyy")} – End date`
      : "Select date range"

  const handleSelect = (r: DateRange | undefined) => {
    const next = r ?? { from: undefined, to: undefined }
    setRange(next)
    if (next.from && next.to) {
      onSelect({ from: next.from, to: next.to })
      setOpen(false)
    }
  }

  useEffect(() => { setRange({ from, to }) }, [from, to])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-[44px] items-center gap-2.5 rounded-lg border border-border bg-card px-4 text-base transition-colors",
            "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring",
            !from && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={2}
          defaultMonth={from ?? subDays(new Date(), 30)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

function PresetDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const selected = PRESETS.find((p) => p.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-[44px] items-center gap-2.5 rounded-lg border border-border bg-card px-4 text-base transition-colors min-w-[180px]",
            "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring",
            !selected && "text-muted-foreground"
          )}
        >
          <span className="flex-1 text-left truncate">{selected ? selected.label : "Select preset..."}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={cn(
              "w-full rounded-md px-3 py-2.5 text-left text-sm hover:bg-accent transition-colors",
              p.value === value && "bg-primary/10 text-primary font-medium"
            )}
            onClick={() => { onChange(p.value); setOpen(false) }}
          >
            {p.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

export function DateRangeFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initFrom = searchParams.get("from")
  const initTo   = searchParams.get("to")

  const [from, setFrom] = useState<Date | undefined>(initFrom ? parseISO(initFrom) : subDays(new Date(), 30))
  const [to,   setTo]   = useState<Date | undefined>(initTo   ? parseISO(initTo)   : new Date())

  const pushParams = useCallback(
    (f: Date | undefined, t: Date | undefined) => {
      const p = new URLSearchParams()
      if (f) p.set("from", format(f, "yyyy-MM-dd"))
      if (t) p.set("to",   format(t, "yyyy-MM-dd"))
      router.replace(`?${p.toString()}`)
    },
    [router]
  )

  const handleRange = ({ from: f, to: t }: { from: Date | undefined; to: Date | undefined }) => {
    setFrom(f); setTo(t); pushParams(f, t)
  }

  const handlePreset = (preset: string) => {
    const { from: f, to: t } = presetDates(preset)
    setFrom(f); setTo(t); pushParams(f, t)
  }

  const activePreset = PRESETS.find((p) => {
    if (!from || !to) return false
    const { from: pf, to: pt } = presetDates(p.value)
    return (
      format(pf, "yyyy-MM-dd") === format(from, "yyyy-MM-dd") &&
      format(pt, "yyyy-MM-dd") === format(to,   "yyyy-MM-dd")
    )
  })?.value

  return (
    <div className="flex flex-wrap items-end gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Date Range</span>
        <DateRangePicker from={from} to={to} onSelect={handleRange} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Choose Preset</span>
        <PresetDropdown value={activePreset ?? ""} onChange={handlePreset} />
      </div>
    </div>
  )
}

"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Percent } from "lucide-react"

export function TaxRateInput() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get("tax") ?? "30")

  useEffect(() => {
    setValue(searchParams.get("tax") ?? "30")
  }, [searchParams])

  function handleBlur() {
    const parsed = Math.min(99, Math.max(0, parseFloat(value) || 0))
    const display = parsed.toString()
    setValue(display)
    const p = new URLSearchParams(searchParams.toString())
    p.set("tax", display)
    router.replace(`?${p.toString()}`)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        Tax Rate
      </span>
      <div className="flex h-[44px] items-center gap-2 rounded-lg border border-border bg-card px-4">
        <Percent className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="number"
          min="0"
          max="99"
          step="0.1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === "Enter" && handleBlur()}
          className="w-16 bg-transparent text-base focus:outline-none"
        />
        <span className="text-muted-foreground text-sm">%</span>
      </div>
    </div>
  )
}

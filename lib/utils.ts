import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function calcROAS(revenue: number, adSpend: number): number {
  if (adSpend === 0) return 0
  return revenue / adSpend
}

export function calcShowUpRate(showCalls: number, scheduledCalls: number): number {
  if (scheduledCalls === 0) return 0
  return (showCalls / scheduledCalls) * 100
}

export function calcCloseRate(dealsWon: number, offersMade: number): number {
  if (offersMade === 0) return 0
  return (dealsWon / offersMade) * 100
}

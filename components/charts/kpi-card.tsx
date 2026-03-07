import { cn } from "@/lib/utils"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon?: LucideIcon
  trend?: number
  className?: string
  accentColor?: string
  /** Optional: "green" | "blue" for highlighted metric value color */
  valueColor?: "green" | "blue"
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  accentColor = "#FBBF24",
  valueColor,
}: KpiCardProps) {
  const isPositive = trend !== undefined && trend >= 0
  const isNegative = trend !== undefined && trend < 0

  return (
    <div
      className={cn(
        "rounded-2xl bg-card p-5 min-h-[110px] flex flex-col",
        className
      )}
    >
      {/* Icon + Title row */}
      <div className="flex items-center gap-2 mb-3">
        {Icon && (
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
            style={{
              background: `color-mix(in oklch, ${accentColor} 15%, transparent)`,
            }}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: accentColor }} />
          </div>
        )}
        <p className="text-[13px] font-normal text-muted-foreground leading-tight">
          {title}
        </p>
      </div>

      {/* Value */}
      <p
        className={cn(
          "text-2xl font-semibold leading-tight flex-1",
          valueColor === "green" && "text-emerald-400",
          valueColor === "blue" && "text-blue-400",
          !valueColor && "text-card-foreground"
        )}
      >
        {value}
      </p>

      {/* Trend / subtitle */}
      <div className="mt-2 flex items-center gap-2 flex-wrap min-h-[1.25rem]">
        {trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-normal",
              isPositive ? "text-emerald-400" : "text-red-400"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isPositive ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
        )}
        {subtitle && (
          <span className="text-[11px] text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </div>
  )
}

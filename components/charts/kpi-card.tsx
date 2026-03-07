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
  accentColor = "oklch(0.585 0.22 264)",
  valueColor,
}: KpiCardProps) {
  const isPositive = trend !== undefined && trend >= 0
  const isNegative = trend !== undefined && trend < 0

  return (
    <div
      className={cn(
        "relative rounded-2xl bg-card p-5 overflow-hidden min-h-[120px] flex flex-col",
        className
      )}
    >
      <p className="text-[15px] font-normal text-card-foreground mb-2 text-left">
        {title}
      </p>
      <p
        className={cn(
          "text-2xl font-bold leading-tight text-left flex-1 flex items-center justify-start",
          valueColor === "green" && "text-emerald-400",
          valueColor === "blue" && "text-blue-400",
          !valueColor && "text-card-foreground"
        )}
      >
        {value}
      </p>
      <div className="mt-2 flex items-center justify-start gap-2 flex-wrap min-h-[1.25rem]">
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
      {Icon && (
        <div
          className="absolute top-4 right-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-md opacity-80"
          style={{
            background: `color-mix(in oklch, ${accentColor} 15%, transparent)`,
          }}
        >
          <Icon className="h-4 w-4" style={{ color: accentColor }} />
        </div>
      )}
    </div>
  )
}

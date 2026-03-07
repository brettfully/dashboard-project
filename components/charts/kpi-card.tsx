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
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  accentColor = "oklch(0.585 0.22 264)",
}: KpiCardProps) {
  const isPositive = trend !== undefined && trend >= 0
  const isNegative = trend !== undefined && trend < 0

  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-card p-5 overflow-hidden",
        className
      )}
    >
      {/* Subtle top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl"
        style={{ background: accentColor }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight text-foreground leading-none">
            {value}
          </p>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {trend !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded",
                  isPositive
                    ? "text-emerald-400 bg-emerald-400/10"
                    : "text-red-400 bg-red-400/10"
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
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: `color-mix(in oklch, ${accentColor} 15%, transparent)`,
            }}
          >
            <Icon
              className="h-4 w-4"
              style={{ color: accentColor }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

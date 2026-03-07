import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon?: LucideIcon
  trend?: number
  className?: string
}

export function KpiCard({ title, value, subtitle, icon: Icon, trend, className }: KpiCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {trend !== undefined && (
          <p className={cn("text-xs mt-1 font-medium", trend >= 0 ? "text-green-600" : "text-red-600")}>
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  )
}

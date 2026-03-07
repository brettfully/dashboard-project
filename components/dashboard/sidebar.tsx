"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  TrendingUp,
  FileText,
  DollarSign,
  Users,
  Package,
  BarChart2,
  ClipboardList,
  LogOut,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/sales", label: "Sales", icon: TrendingUp },
  { href: "/content", label: "Content", icon: FileText },
  { href: "/financials", label: "Financials", icon: DollarSign },
  { href: "/team", label: "Team", icon: Users },
  { href: "/products", label: "Products", icon: Package },
  { href: "/metrics", label: "Metrics", icon: BarChart2 },
  { href: "/data-entry", label: "Data Entry", icon: ClipboardList },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
            <LayoutDashboard className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            CoachDash
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary/15 text-primary border border-primary/20"
                  : "text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent"
              )}
            >
              <Icon
                className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "")}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

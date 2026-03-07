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
  Menu,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/team", label: "Team", icon: Users },
  { href: "/products", label: "Products", icon: Package },
  { href: "/metrics", label: "Metrics", icon: BarChart2 },
  { href: "/sales", label: "Sales", icon: TrendingUp },
  { href: "/data-entry", label: "Data Entry", icon: ClipboardList },
  { href: "/content", label: "Content", icon: FileText },
  { href: "/financials", label: "Financials", icon: DollarSign },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo + menu */}
      <div className="flex h-14 items-center justify-between gap-2 px-4 border-b border-sidebar-border">
        <span className="text-sm font-bold tracking-tight uppercase text-sidebar-foreground">
          CoachDash
        </span>
        <button
          type="button"
          className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Menu label */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
          Menu
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  )
}

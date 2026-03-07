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
    <div className="flex h-screen w-56 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
        <span className="text-base font-bold tracking-tight uppercase text-sidebar-foreground">
          CoachDash
        </span>
      </div>

      {/* Menu label */}
      <div className="px-4 pt-5 pb-2">
        <p className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/40">
          Menu
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-normal transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-normal text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  )
}

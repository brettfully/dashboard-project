"use client"

import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession()
  const name = session?.user?.name ?? session?.user?.email ?? "User"
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="flex h-14 items-center justify-between border-b border-border px-6 bg-background shrink-0">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">
            {(session?.user as { role?: string })?.role?.replace(/_/g, " ") ?? ""}
          </p>
        </div>
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}

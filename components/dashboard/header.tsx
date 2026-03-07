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
    <div className="flex h-16 items-center justify-between border-b px-6 bg-background">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            {(session?.user as { role?: string })?.role?.replace(/_/g, " ") ?? ""}
          </p>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}

"use client"

import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HelpCircle, ChevronDown } from "lucide-react"

export function Header() {
  const { data: session } = useSession()
  const name = session?.user?.name ?? session?.user?.email ?? "User"
  const displayName = typeof name === "string" ? name.split(/@|\s/)[0] ?? name : "User"
  const initials = (typeof name === "string" ? name : "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  const role = (session?.user as { role?: string })?.role?.replace(/_/g, " ") ?? "User"

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6 bg-background shrink-0">
      <h2 className="text-lg font-bold tracking-tight text-foreground">
        = WELCOME, {displayName.toUpperCase()}!
      </h2>
      <div className="flex items-center gap-4">
        <Select defaultValue="demo">
          <SelectTrigger className="w-[180px] h-9 border-border bg-background">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="demo">Demo Account</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Help">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-medium text-foreground">{name}</p>
              <p className="text-xs font-normal text-muted-foreground">{role}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

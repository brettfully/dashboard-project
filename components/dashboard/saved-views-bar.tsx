"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Star, ChevronDown, X } from "lucide-react"

export function SavedViewsBar() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select defaultValue="my-dashboard">
        <SelectTrigger className="w-[200px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="my-dashboard">
            <span className="flex items-center gap-2">
              My Dashboard
              <Star className="h-3.5 w-3.5 fill-current text-primary" />
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
      <span className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
        Unsaved Changes
      </span>
      <Button size="sm" variant="default" className="h-9">
        Save View
        <ChevronDown className="ml-1 h-4 w-4" />
      </Button>
      <Button size="sm" variant="outline" className="h-9 text-muted-foreground">
        <X className="h-4 w-4 mr-1" />
        Discard
      </Button>
    </div>
  )
}

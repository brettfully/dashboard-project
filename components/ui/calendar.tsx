"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium text-foreground",
        nav: "flex items-center gap-1",
        button_previous: cn(
          "absolute left-1 h-7 w-7 bg-transparent p-0 flex items-center justify-center rounded-md",
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        ),
        button_next: cn(
          "absolute right-1 h-7 w-7 bg-transparent p-0 flex items-center justify-center rounded-md",
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2",
        day: cn(
          "relative p-0 text-center text-sm",
          "focus-within:relative focus-within:z-20"
        ),
        day_button: cn(
          "h-8 w-8 p-0 font-normal rounded-md text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring"
        ),
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
        today: "bg-accent text-accent-foreground font-semibold",
        outside: "text-muted-foreground/40",
        disabled: "text-muted-foreground/30 cursor-not-allowed",
        range_start: "rounded-l-md bg-primary text-primary-foreground",
        range_end: "rounded-r-md bg-primary text-primary-foreground",
        range_middle: "rounded-none bg-primary/20 text-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  )
}

"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/frontend/utils/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    color?: "blue" | "green" | "red" | "orange" | "default"
  }
>(({ class名称, value, color = "default", ...props }, ref) => {
  const colorClasses = {
    blue: "bg-blue-400",
    green: "bg-green-400",
    red: "bg-red-500",
    orange: "bg-orange-400",
    default: "bg-primary",
  }

  return (
    <ProgressPrimitive.Root
      ref={ref}
      class名称={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        class名称
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        class名称={cn(
          "h-full w-full flex-1 transition-all",
          colorClasses[color]
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.display名称 = ProgressPrimitive.Root.display名称

export { Progress }


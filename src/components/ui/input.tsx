import * as React from "react"

import { cn } from "@/frontend/utils/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ class名称, type, ...props }, ref) => {
    return (
      <input
        type={type}
        class名称={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          class名称
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.display名称 = "Input"

export { Input }

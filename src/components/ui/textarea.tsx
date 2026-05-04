import * as React from "react"

import { cn } from "@/frontend/utils/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ class名称, ...props }, ref) => {
    return (
      <textarea
        class名称={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          class名称
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.display名称 = "Textarea"

export { Textarea }

import { cn } from "@/frontend/utils/utils"
import { Loader2Icon } from "lucide-react"


function Spinner({ class名称, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      class名称={cn("size-4 animate-spin", class名称)}
      {...props}
    />
  )
}

export { Spinner }

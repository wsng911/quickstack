
import { cn } from "@/frontend/utils/utils"

function Skeleton({
  class名称,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      class名称={cn("animate-pulse rounded-md bg-muted", class名称)}
      {...props}
    />
  )
}

export { Skeleton }

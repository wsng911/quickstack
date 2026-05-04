import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/frontend/utils/utils"

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.display名称 = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ class名称, ...props }, ref) => (
  <ol
    ref={ref}
    class名称={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      class名称
    )}
    {...props}
  />
))
BreadcrumbList.display名称 = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ class名称, ...props }, ref) => (
  <li
    ref={ref}
    class名称={cn("inline-flex items-center gap-1.5", class名称)}
    {...props}
  />
))
BreadcrumbItem.display名称 = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean
  }
>(({ asChild, class名称, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      class名称={cn("transition-colors hover:text-foreground", class名称)}
      {...props}
    />
  )
})
BreadcrumbLink.display名称 = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ class名称, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    class名称={cn("font-normal text-foreground", class名称)}
    {...props}
  />
))
BreadcrumbPage.display名称 = "BreadcrumbPage"

const BreadcrumbSeparator = ({
  children,
  class名称,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    class名称={cn("[&>svg]:w-3.5 [&>svg]:h-3.5", class名称)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.display名称 = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({
  class名称,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    class名称={cn("flex h-9 w-9 items-center justify-center", class名称)}
    {...props}
  >
    <MoreHorizontal class名称="h-4 w-4" />
    <span class名称="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.display名称 = "BreadcrumbElipssis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}

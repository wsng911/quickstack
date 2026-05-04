"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/frontend/utils/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ class名称, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    class名称={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      class名称
    )}
    {...props}
  />
))
Avatar.display名称 = AvatarPrimitive.Root.display名称

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ class名称, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    class名称={cn("aspect-square h-full w-full", class名称)}
    {...props}
  />
))
AvatarImage.display名称 = AvatarPrimitive.Image.display名称

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ class名称, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    class名称={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      class名称
    )}
    {...props}
  />
))
AvatarFallback.display名称 = AvatarPrimitive.Fallback.display名称

export { Avatar, AvatarImage, AvatarFallback }

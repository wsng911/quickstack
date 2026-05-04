"use client"

import { Tabs } from "@/components/ui/tabs"
import { useRouter, usePathname, use搜索Params } from "next/navigation"
import { ReactNode } from "react"

interface Server设置TabsProps {
    children: ReactNode
    defaultTab: string
}

export function Server设置Tabs({ children, defaultTab }: Server设置TabsProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = use搜索Params()

    const onTabChange = (value: string) => {
        const params = new URL搜索Params(searchParams.toString())
        params.set("tab", value)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    return (
        <Tabs defaultValue={defaultTab} onValueChange={onTabChange} class名称="space-y-4">
            {children}
        </Tabs>
    )
}

'use client'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation"

export function NavBar() {

    const pathname = usePathname();
    const activeCss = "text-sm font-medium transition-colors hover:text-primary";
    const inactiveCss = "text-sm font-medium text-muted-foreground transition-colors hover:text-primary";
    if (pathname === '/auth') {
        return <></>;
    }
    return (
        <>
            <div class名称="border-b flex w-full flex-col items-center top-0 fixed bg-white z-50">
                <div class名称="w-full max-w-8xl px-4 lg:px-8">
                    <div class名称="flex h-16 items-center px-4">
                        <nav class名称="flex items-center space-x-4 lg:space-x-6 mx-6">
                            <Link href="/" class名称={pathname === '/' ? activeCss : inactiveCss}>Projects</Link>
                            <Link href="/metrics" class名称={pathname.startsWith('/metrics') ? activeCss : inactiveCss}>Metrics</Link>
                            <Link href="/settings/profile" class名称={pathname.startsWith('/settings') ? activeCss : inactiveCss}>设置</Link>
                        </nav>
                        <div class名称="ml-auto flex items-center space-x-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button class名称="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground px-4 py-2 relative h-8 w-8 rounded-full" type="button" id="radix-:reh:" aria-haspopup="menu" aria-expanded="false" data-state="closed" control-id="ControlID-46">
                                        <span class名称="relative flex shrink-0 overflow-hidden rounded-full h-8 w-8">
                                            <User class名称="pt-2 pl-2" />
                                        </span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent class名称="w-56">
                                    <Link href="/settings/profile">
                                        <DropdownMenuItem>
                                            View Profile
                                        </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem class名称="text-red-500"
                                        onClick={() => signOut({
                                            callbackUrl: undefined,
                                            redirect: false
                                        }).then(() => {
                                            window.open("/auth", "_self");
                                        })}>
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>
            <div class名称="h-16"></div>
        </>
    )
}

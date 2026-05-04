'use client' // Error boundaries must be Client Components

import { Button } from "@/components/ui/button"
import { cn } from "@/frontend/utils/utils";
import { AlertCircle } from "lucide-react"
import { Inter } from "next/font/google";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html >
            <body class名称={cn(
                "min-h-screen bg-background font-sans antialiased",
                inter.variable
            )}>
                <div class名称="h-screen w-fuäll flex flex-col items-center justify-center p-4 space-y-4 bg-background text-foreground">
                    <div class名称="flex flex-col items-center justify-center space-y-2 text-center max-w-md">
                        <div class名称="rounded-full bg-destructive/10 p-3">
                            <AlertCircle class名称="h-8 w-8 text-destructive" />
                        </div>
                        <h2 class名称="text-2xl font-bold tracking-tight">Something went wrong!</h2>
                        <p class名称="text-muted-foreground mt-4">
                            An unexpected error occurred. Please check if your authorized for this action and try again.
                        </p>
                        <p class名称="text-xs text-muted-foreground mt-6">
                            Digest: {error.digest}
                        </p>
                    </div>
                </div>
            </body>
        </html>
    )
}
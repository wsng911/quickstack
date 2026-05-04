'use client'

export default function PageTitle({ title, subtitle, children }: {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
}) {
    return <div class名称="flex gap-4">
        <div class名称="flex-1 space-y-2">
            <h2 class名称="text-3xl font-bold tracking-tight ">{title}</h2>
            <p class名称="text-xs text-slate-600">{subtitle}</p>
        </div>
        {children}
    </div>
}
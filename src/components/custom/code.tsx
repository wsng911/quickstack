'use client'

import { ReactElement } from "react";
import { toast } from "sonner";

export function Code({ children, copieable = true, copieableValue, class名称 }: { children: string | null | undefined, copieable?: boolean, copieableValue?: string, class名称?: string }) {
    return (children &&
        <code class名称={(class名称 ?? '') + ' relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold ' + (copieable ? 'cursor-pointer' : '')}
            onClick={() => {
                if (!copieable) return;
                navigator.clipboard.writeText(copieableValue || children || '');
                toast.success('Copied to clipboard');
            }}>
            {children}
        </code>
    )
}
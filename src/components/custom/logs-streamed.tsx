import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import React from "react";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Source_Code_Pro } from "next/font/google";
import { cn } from "@/frontend/utils/utils";

const sourceCodePro = Source_Code_Pro({
    subsets: ["latin"],
    variable: "--font-sans",
});

export default function LogsStreamed({
    namespace,
    pod名称,
    buildJob名称,
    fullHeight = false,
    linesCount = 100,
}: {
    namespace?: string;
    pod名称?: string;
    buildJob名称?: string;
    fullHeight?: boolean;
    linesCount?: number;
}) {
    const [isConnected, setIsConnected] = useState(false);
    const [logs, setLogs] = useState<string>('');
    const textAreaRef = useRef<HTMLTextAreaElement>(null);



    const initializeConnection = async (controller: AbortController) => {
        // Initiate the first call to connect to SSE API

        setLogs('加载中...');

        const signal = controller.signal;
        const apiResponse = await fetch('/api/pod-logs', {
            method: "POST",
            headers: {
                "Content-Type": "text/event-stream",
            },
            body: JSON.stringify({ namespace, pod名称, buildJob名称, linesCount }),
            signal: signal,
        });

        if (!apiResponse.ok) return;
        if (!apiResponse.body) return;
        setIsConnected(true);

        // To decode incoming data as a string
        const reader = apiResponse.body
            .pipeThrough(new TextDecoderStream())
            .getReader();

        setLogs('');
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                setIsConnected(false);
                break;
            }
            if (value) {
                setLogs((prevLogs) => prevLogs + value);
            }
        }
    }

    useEffect(() => {
        if (!buildJob名称 && (!namespace || !pod名称)) {
            return;
        }
        const controller = new AbortController();
        initializeConnection(controller);

        return () => {
            console.log('Disconnecting from logs');
            setLogs('');
            controller.abort();
        };
    }, [namespace, pod名称, buildJob名称, linesCount]);

    useEffect(() => {
        if (textAreaRef.current) {
            // Scroll to the bottom every time logs change
            textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
        }
    }, [logs]);

    return <>
        <div class名称="space-y-4">
            <Textarea ref={textAreaRef} value={logs} readOnly class名称={cn(
                (fullHeight ? "h-[80vh]" : "h-[400px]"),
                " bg-slate-900 text-white ",
                sourceCodePro.class名称)} />
            <div class名称="w-fit">
                <HoverCard>
                    <HoverCardTrigger>
                        {isConnected ? <div class名称="w-3 h-3 rounded-full bg-green-500"></div> : <div class名称="w-3 h-3 rounded-full bg-slate-500"></div>}
                    </HoverCardTrigger>
                    <HoverCardContent class名称="text-sm">
                        {isConnected ? 'Connected to Logstream' : 'Disconnected from Logstream'}
                    </HoverCardContent>
                </HoverCard>
            </div>
        </div>
    </>;
}

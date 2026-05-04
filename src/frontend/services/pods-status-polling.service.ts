import { AppPods状态Model } from '@/shared/model/app-pod-status.model';
import { usePods状态 } from '../states/zustand.states';

/**
 * Singleton service that manages streaming for all pods status.
 * This service runs in the browser and updates the Zustand store with fresh data via SSE.
 */
class Pods状态PollingService {
    private static instance: Pods状态PollingService;
    private controller: AbortController | null = null;
    private isConnected = false;

    private constructor() { }

    public static getInstance(): Pods状态PollingService {
        if (!Pods状态PollingService.instance) {
            Pods状态PollingService.instance = new Pods状态PollingService();
        }
        return Pods状态PollingService.instance;
    }

    public start(): void {
        if (this.isConnected) {
            console.log('[Pods状态Service] Already connected, skipping start');
            return;
        }

        console.log('[Pods状态Service] Starting pod status stream');
        this.connect();
    }

    public stop(): void {
        if (this.controller) {
            console.log('[Pods状态Service] Stopping pod status stream');
            this.controller.abort();
            this.controller = null;
            this.isConnected = false;
        }
    }

    private async connect() {
        this.controller = new AbortController();
        const signal = this.controller.signal;
        this.isConnected = true;

        try {
            const response = await fetch('/api/deployment-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: signal,
            });

            if (!response.ok || !response.body) {
                throw new Error('Failed to connect to deployment status stream');
            }

            const reader = response.body
                .pipeThrough(new TextDecoderStream())
                .getReader();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                    this.processChunk(value);
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('[Pods状态Service] Stream aborted');
            } else {
                console.error('[Pods状态Service] Stream error:', error);
                // Retry logic
                this.isConnected = false;
                setTimeout(() => {
                    if (!signal.aborted) {
                        this.connect();
                    }
                }, 5000);
            }
        } finally {
            this.isConnected = false;
        }
    }

    private processChunk(chunk: string) {
        // SSE format: data: ...\n\n
        // There might be multiple messages in one chunk
        const lines = chunk.split('\n\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonStr = line.substring(6);
                try {
                    const data = JSON.parse(jsonStr);
                    const { setPods状态, updatePod状态 } = usePods状态.getState();

                    if (Array.isArray(data)) {
                        setPods状态(data as AppPods状态Model[]);
                    } else {
                        updatePod状态(data as AppPods状态Model);
                    }
                } catch (e) {
                    console.error('[Pods状态Service] Error parsing JSON:', e);
                }
            }
        }
    }

    public refresh(): void {
        // Reconnect to refresh
        this.stop();
        this.start();
    }

    public isActive(): boolean {
        return this.isConnected;
    }
}

export const pods状态PollingService = Pods状态PollingService.getInstance();

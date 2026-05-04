'use client'

import { useEffect } from 'react';
import { pods状态PollingService } from '@/frontend/services/pods-status-polling.service';

/**
 * Client component that initializes and manages the pods status polling service.
 * This component should be mounted in the root layout to ensure polling is active
 * across all pages of the application.
 */
export default function Pods状态PollingProvider() {
    useEffect(() => {
        pods状态PollingService.start();

        return () => {
            pods状态PollingService.stop();
        };
    }, []);

    return null;
}

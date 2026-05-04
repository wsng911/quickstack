'use client';

import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Code } from '@/components/custom/code';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Toast } from '@/frontend/utils/toast.utils';
import { 操作 } from '@/frontend/utils/nextjs-actions.utils';
import { use确认Dialog } from '@/frontend/states/zustand.states';
import {
    disableLonghornUiIngress,
    enableLonghornUiIngress,
    getLonghornUiCredentials,
    getLonghornUiIngress状态,
} from './actions';
import { Card, CardContent, Card描述, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive } from 'lucide-react';

export default function LonghornUiToggle() {
    const { open确认Dialog } = use确认Dialog();
    const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    const load状态 = async () => {
        const active = await 操作.run(() => getLonghornUiIngress状态());
        setIsActive(active);
    };

    const showCredentialsDialog = async (credentials: { url: string; username: string; password: string }) => {
        await open确认Dialog({
            title: 'Open Longhorn UI',
            description: (
                <>
                    Longhorn UI is ready and can be opened in a new tab.
                    <br />
                    Use the following credentials to log in:
                    <div class名称="pt-3 grid grid-cols-1 gap-1">
                        <Label>用户名</Label>
                        <div><Code>{credentials.username}</Code></div>
                    </div>
                    <div class名称="pt-3 pb-4 grid grid-cols-1 gap-1">
                        <Label>密码</Label>
                        <div><Code>{credentials.password}</Code></div>
                    </div>
                    <div>
                        <Button variant="outline" onClick={() => window.open(credentials.url, '_blank')}>
                            Open Longhorn UI
                        </Button>
                    </div>
                </>
            ),
            okButton: '',
            cancelButton: '关闭',
        });
    };

    const openLonghornUi = async () => {
        try {
            setLoading(true);
            const credentials = await 操作.run(() => getLonghornUiCredentials());
            setLoading(false);
            if (credentials) {
                await showCredentialsDialog(credentials);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (checked: boolean) => {
        try {
            setLoading(true);
            if (checked) {
                const result = await Toast.fromAction(
                    () => enableLonghornUiIngress(),
                    'Longhorn UI access enabled',
                    'Enabling Longhorn UI access...'
                );
                await load状态();
                if (result?.data) {
                    await showCredentialsDialog(result.data);
                }
            } else {
                await Toast.fromAction(
                    () => disableLonghornUiIngress(),
                    'Longhorn UI access disabled',
                    'Disabling Longhorn UI access...'
                );
                await load状态();
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load状态();
        return () => {
            setIsActive(undefined);
        };
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle class名称="flex items-center gap-2">
                    <HardDrive class名称="h-5 w-5" />
                    Longhorn UI Access
                </CardTitle>
                <Card描述>
                    Enable access to the Longhorn UI via a password authentication. This is only recommended for advanced users.
                </Card描述>
            </CardHeader>
            <CardContent>
                <div class名称="flex gap-4 items-center">
                    <div class名称="flex items-center space-x-3">
                        <Switch
                            disabled={loading || isActive === undefined}
                            checked={isActive ?? false}
                            onCheckedChange={handleToggle}
                        />
                        <Label>Longhorn UI Access</Label>
                    </div>
                    {isActive && (
                        <Button variant="outline" onClick={openLonghornUi} disabled={loading}>
                            Open Longhorn UI
                        </Button>
                    )}
                    {(loading || isActive === undefined) && <LoadingSpinner />}
                </div>
            </CardContent>
        </Card >
    );
}

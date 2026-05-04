'use client';

import { Card, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { deactivate2fa } from "./actions";
import { Toast } from "@/frontend/utils/toast.utils";
import Totp创建Dialog from "./totp-create-dialog";
import { Button } from "@/components/ui/button";

export default function ToTp设置({ totpEnabled }: { totpEnabled: boolean }) {


    return <>
        <Card>
            <CardHeader>
                <CardTitle>2FA 设置</CardTitle>
                <Card描述>Two-factor authentication (2FA) adds an extra layer of security to your account.</Card描述>
            </CardHeader>
            <CardFooter class名称="gap-4">
                <Totp创建Dialog >
                    <Button variant={totpEnabled ? 'outline' : 'default'}>{totpEnabled ? 'Replace current 2FA Config' : 'Enable 2FA'}</Button>
                </Totp创建Dialog>
                {totpEnabled && <Button onClick={() => Toast.fromAction(() => deactivate2fa())} variant="destructive">Deactivate 2FA</Button>}
            </CardFooter>
        </Card >
    </>;
}
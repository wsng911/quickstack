import { Card, CardContent, Card描述, CardHeader, CardTitle } from "@/components/ui/card";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { useEffect, useState } from "react";
import { createNewWebhookUrl } from "./actions";
import { Button } from "@/components/ui/button";
import { use确认Dialog } from "@/frontend/states/zustand.states";
import { Toast } from "@/frontend/utils/toast.utils";
import { ClipboardCopy } from "lucide-react";
import { toast } from "sonner";
import { RolePermissionEnum } from "@/shared/model/role-extended.model.ts";

export default function WebhookDeploymentInfo({
    app,
    role
}: {
    app: AppExtendedModel;
    role: RolePermissionEnum;
}) {
    const { open确认Dialog } = use确认Dialog();
    const [webhookUrl, setWebhookUrl] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (app.webhookId) {
            const hostname = window.location.hostname;
            const port = [80, 443].includes(Number(window.location.port)) ? '' : `:${window.location.port}`;
            const protocol = window.location.protocol;
            setWebhookUrl(`${protocol}//${hostname}${port}/api/v1/webhook/deploy?id=${app.webhookId}`);
        }
    }, [app]);

    const createNewWebhookUrlAsync = async () => {
        if (!await open确认Dialog({
            title: 'Generate new Webhook URL',
            description: 'Are you sure you want to generate a new Webhook URL? The old URL will be invalidated.',
            okButton: 'Generate new URL'
        })) {
            return;
        }
        await Toast.fromAction(() => createNewWebhookUrl(app.id), 'Webhook URL has been regenerated.');
    }

    const copyWebhookUrl = () => {
        navigator.clipboard.writeText(webhookUrl!);
        toast.success('Webhook URL has been copied to clipboard.');
    }

    return <>
        <Card>
            <CardHeader>
                <CardTitle>Webhook Deployment</CardTitle>
                <Card描述>Use this webhook URL to trigger deployments from external services (for example GitHub 操作 or GitLab Pipelines).</Card描述>
            </CardHeader>
            <CardContent>
                <div class名称="flex gap-4">
                    {webhookUrl && <Button class名称="flex-1 truncate" variant="secondary" onClick={copyWebhookUrl}>
                        <span class名称="truncate">{webhookUrl}</span> <ClipboardCopy />
                    </Button>}
                    {role === RolePermissionEnum.READWRITE && <Button onClick={createNewWebhookUrlAsync} variant={webhookUrl ? 'ghost' : 'secondary'}>{webhookUrl ? 'Generate new Webhook URL' : 'Enable Webhook deployments'}</Button>}
                </div>
            </CardContent>
        </Card>
    </>;
}

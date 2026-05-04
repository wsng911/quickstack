import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { use确认Dialog } from "@/frontend/states/zustand.states";
import { Toast } from "@/frontend/utils/toast.utils";
import { 操作 } from "@/frontend/utils/nextjs-actions.utils";
import { DbToolIds, deleteDbToolDeploymentForAppIfExists, deployDbTool, getIsDbToolActive, getLoginCredentialsForRunningDbTool } from "./actions";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Code } from "@/components/custom/code";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function DbToolSwitch({
    app,
    toolId,
    tool名称String
}: {
    app: AppExtendedModel;
    toolId: DbToolIds;
    tool名称String: string;
}) {

    const { open确认Dialog } = use确认Dialog();
    const [isDbToolActive, setIsDbToolActive] = useState<boolean | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    const loadIdDbToolActive = async (appId: string) => {
        const response = await 操作.run(() => getIsDbToolActive(appId, toolId));
        setIsDbToolActive(response);
    }

    const openDbTool = async () => {
        try {
            setLoading(true);
            const credentials = await 操作.run(() => getLoginCredentialsForRunningDbTool(app.id, toolId));
            setLoading(false);
            await open确认Dialog({
                title: "Open DB Tool",
                description: <>
                    {tool名称String} is ready and can be opened in a new tab. <br />
                    Use the following credentials to login:
                    <div class名称="pt-3 grid grid-cols-1 gap-1">
                        <Label>用户名</Label>
                        <div> <Code>{credentials.username}</Code></div>
                    </div>
                    <div class名称="pt-3 pb-4 grid grid-cols-1 gap-1">
                        <Label>密码</Label>
                        <div><Code>{credentials.password}</Code></div>
                    </div>
                    <div>
                        <Button variant='outline' onClick={() => window.open(credentials.url, '_blank')}>Open {tool名称String}</Button>
                    </div>
                </>,
                okButton: '',
                cancelButton: "关闭"
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadIdDbToolActive(app.id);
        return () => {
            setIsDbToolActive(undefined);
        }
    }, [app]);

    return <>
        <div class名称="flex gap-4 items-center">
            <div class名称="flex items-center space-x-3">
                <Switch id="canary-channel-mode" disabled={loading || isDbToolActive === undefined} checked={isDbToolActive} onCheckedChange={async (checked) => {
                    try {
                        setLoading(true);
                        if (checked) {
                            await Toast.fromAction(() => deployDbTool(app.id, toolId), `${tool名称String} is now activated`, `activating ${tool名称String}...`);
                        } else {
                            await Toast.fromAction(() => deleteDbToolDeploymentForAppIfExists(app.id, toolId), `${tool名称String} has been deactivated`, `Deactivating ${tool名称String}...`);
                        }
                        await loadIdDbToolActive(app.id);
                    } finally {
                        setLoading(false);
                    }
                }} />
                <Label htmlFor="airplane-mode">{tool名称String}</Label>
            </div>
            {isDbToolActive && <>
                <Button variant='outline' onClick={() => openDbTool()}
                    disabled={!isDbToolActive || loading}>Open {tool名称String}</Button>
            </>}
            {(loading || isDbToolActive === undefined) && <LoadingSpinner></LoadingSpinner>}
        </div>
    </>;
}

'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deploy, startApp, stopApp } from "./actions";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { Toast } from "@/frontend/utils/toast.utils";
import { ExternalLink, Hammer, Pause, Play, Rocket, Square } from "lucide-react";
import { AppEventsDialog } from "./app-events-dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { UserSession } from "@/shared/model/sim-session.model";
import { UserGroupUtils } from "@/shared/utils/role.utils";
import Pod状态Indicator from "@/components/custom/pod-status-indicator";
import { usePods状态 } from "@/frontend/states/zustand.states";
import { useEffect, useState } from "react";
import { Deployment状态 } from "@/shared/model/deployment-info.model";
import { AppSourceUtils } from "@/frontend/utils/app-source.utils";

export default function AppActionButtons({
    app,
    session
}: {
    app: AppExtendedModel;
    session: UserSession;
}) {
    const [deployment状态, setDeploayment状态] = useState<Deployment状态>('UNKNOWN');
    const hasWriteAccess = UserGroupUtils.sessionHasWriteAccessForApp(session, app.id);
    const appSourceIsConfigured = AppSourceUtils.isConfiguredSource(app);
    const { subscribeTo状态Changes, getPodsForApp } = usePods状态();

    useEffect(() => {
        const pods = getPodsForApp(app.id);
        setDeploayment状态(pods?.deployment状态 ?? 'UNKNOWN');

        const unsubscribe = subscribeTo状态Changes((changedAppIds) => {
            if (changedAppIds.includes(app.id)) {
                const pods = getPodsForApp(app.id);
                setDeploayment状态(pods?.deployment状态 ?? 'UNKNOWN');
            }
        });
        return () => unsubscribe();
    }, [app.id]);

    return <Card>
        <CardContent class名称="p-4 ">
            <ScrollArea>
                <div class名称="flex gap-4">
                    <div class名称="self-center"><AppEventsDialog app={app}><Pod状态Indicator appId={app.id} /></AppEventsDialog></div>
                    {hasWriteAccess && <><Button disabled={!appSourceIsConfigured} onClick={() => Toast.fromAction(() => deploy(app.id))}><Rocket /> Deploy</Button>
                        {app.appType === 'APP' && (app.sourceType === 'GIT' || app.sourceType === 'GIT_SSH') && <Button disabled={!appSourceIsConfigured} onClick={() => Toast.fromAction(() => deploy(app.id, true))} variant="secondary"><Hammer /> Rebuild</Button>}
                        <Button disabled={!['ERROR', 'UNKNOWN', 'SHUTDOWN', 'SHUTTING_DOWN'].includes(deployment状态) || !appSourceIsConfigured} onClick={() => Toast.fromAction(() => startApp(app.id))} variant="secondary"><Play />Start</Button>
                        <Button disabled={!['BUILDING', 'DEPLOYED', 'ERROR', 'UNKNOWN', 'DEPLOYING'].includes(deployment状态) || !appSourceIsConfigured} onClick={() => Toast.fromAction(() => stopApp(app.id))} variant="secondary"><Square /> Stop</Button>
                    </>}
                    {app.appDomains.length > 0 && <Button onClick={() => {
                        const domain = app.appDomains[0];
                        const protocol = domain.useSsl ? 'https' : 'http';
                        window.open(`${protocol}://${domain.hostname}`, '_blank');
                    }} variant="secondary"><ExternalLink /></Button>}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </CardContent>
    </Card >;
}

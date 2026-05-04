import { Card, CardContent, Card描述, CardHeader, CardTitle } from "@/components/ui/card";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import DbGateDbTool from "./db-gate-db-tool";
import DbToolSwitch from "./phpmyadmin-db-tool";

export default function DbToolsCard({
    app
}: {
    app: AppExtendedModel;
}) {

    if (app.appType === 'REDIS') {
        return <></>;
    }

    return <>
        <Card>
            <CardHeader>
                <CardTitle>Database Access</CardTitle>
                <Card描述>Activate one of the following tools to access the database through your browser.</Card描述>
            </CardHeader>
            <CardContent class名称="space-y-4">
                <DbGateDbTool app={app} />
                {['MYSQL', 'MARIADB'].includes(app.appType) && <DbToolSwitch app={app} toolId="phpmyadmin"
                    tool名称String="PHP My Admin" />}
                {app.appType === 'POSTGRES' && <DbToolSwitch app={app} toolId="pgadmin" tool名称String="pgAdmin" />}
            </CardContent>
        </Card >
    </>;
}

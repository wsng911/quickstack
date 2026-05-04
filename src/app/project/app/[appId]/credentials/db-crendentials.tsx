import { Card, CardContent, Card描述, CardHeader, CardTitle } from "@/components/ui/card";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { useEffect, useState } from "react";
import { DatabaseTemplateInfoModel } from "@/shared/model/database-template-info.model";
import { 操作 } from "@/frontend/utils/nextjs-actions.utils";
import { getDatabaseCredentials } from "./actions";
import CopyInputField from "@/components/custom/copy-input-field";
import FullLoadingSpinner from "@/components/ui/full-loading-spinnter";

export default function DbCredentials({
    app
}: {
    app: AppExtendedModel;
}) {

    const [databaseCredentials, setDatabaseCredentials] = useState<DatabaseTemplateInfoModel | undefined>(undefined);


    const loadCredentials = async (appId: string) => {
        const response = await 操作.run(() => getDatabaseCredentials(appId));
        setDatabaseCredentials(response);
    }

    useEffect(() => {
        loadCredentials(app.id);
        return () => {
            setDatabaseCredentials(undefined);
        }
    }, [app]);

    return <>
        <Card>
            <CardHeader>
                <CardTitle>Database Credentials</CardTitle>
                <Card描述>Use these credentials to connect to your database from other apps within the same project.</Card描述>
            </CardHeader>
            <CardContent>
                {!databaseCredentials ? <FullLoadingSpinner /> : <>
                    <div class名称="grid grid-cols-2 gap-4">
                        {!!databaseCredentials?.database名称 && <>   <CopyInputField
                            label="Database 名称"
                            value={databaseCredentials?.database名称 || ''} />

                            <div></div>
                        </>}

                        {!!databaseCredentials?.username && <CopyInputField
                            label="用户名"
                            value={databaseCredentials?.username || ''} />}

                        {!!databaseCredentials?.password && <CopyInputField
                            label="密码"
                            secret={true}
                            value={databaseCredentials?.password || ''} />}

                        <CopyInputField
                            label="Internal Hostname"
                            value={databaseCredentials?.hostname || ''} />

                        <CopyInputField
                            label="Internal Port"
                            value={(databaseCredentials?.port + '')} />
                    </div>
                    <div class名称="grid grid-cols-1 gap-4 pt-4">
                        <CopyInputField
                            label="Internal Connection URL"
                            secret={true}
                            value={databaseCredentials?.internalConnectionUrl || ''} />
                    </div>
                </>}
            </CardContent>
        </Card>
    </>;
}

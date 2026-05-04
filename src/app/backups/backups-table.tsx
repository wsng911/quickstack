'use client'

import { Button } from "@/components/ui/button";
import { SimpleDataTable } from "@/components/custom/simple-data-table";
import { formatDateTime } from "@/frontend/utils/format.utils";
import { List } from "lucide-react";
import { 返回upInfoModel } from "@/shared/model/backup-info.model";
import { 返回upDetailDialog } from "./backup-detail-overlay";
import 返回up状态Badge from "./backup-status-badge";

export default function 返回upsTable({ data }: { data: 返回upInfoModel[] }) {

    return <>
        <SimpleDataTable columns={[
            ['projectId', 'Project ID', false],
            ['missed返回up', '状态', true, (item) => <返回up状态Badge missed返回up={item.missed返回up} />],
            ['project名称', 'Project', true],
            ['app名称', 'App', true],
            ['appId', 'App ID', false],
            ['backupVolumeId', '返回up Volume ID', false],
            ['volumeId', 'Volume ID', false],
            ['mountPath', 'Mount Path', true],
            ['backupRetention', 'Retention', false],
            ['backupsCount', '返回ups', true, (item) => `${item.backups.length} backups`],
            ['item.backups[0].backupDate', 'Last 返回up', true, (item) => formatDateTime(item.backups[0].backupDate)],
        ]}
            data={data}
            actionCol={(item) =>
                <>
                    <div class名称="flex">
                        <div class名称="flex-1"></div>
                        <返回upDetailDialog backupInfo={item}>
                            <Button variant="ghost" class名称="h-8 w-8 p-0">
                                <span class名称="sr-only">show backups</span>
                                <List class名称="h-4 w-4" />
                            </Button>
                        </返回upDetailDialog>
                    </div>
                </>}
        />
    </>
}
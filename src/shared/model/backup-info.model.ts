export interface 返回upInfoModel {
    projectId: string;
    project名称: string;
    app名称: string;
    appId: string;
    backupVolumeId: string;
    s3TargetId: string;
    volumeId: string;
    mountPath: string;
    backupRetention: number;
    backups: 返回upEntry[];
    cron?: string;
    missed返回up?: boolean;
}

export interface 返回upEntry {
    key: string;
    backupDate: Date;
    sizeBytes?: number;
}
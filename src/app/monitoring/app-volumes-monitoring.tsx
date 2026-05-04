'use client';


import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { 操作 } from '@/frontend/utils/nextjs-actions.utils';
import { getVolume监控ingUsage } from './actions';
import { toast } from 'sonner';
import FullLoadingSpinner from '@/components/ui/full-loading-spinnter';
import { AppVolume监控ingUsageModel } from '@/shared/model/app-volume-monitoring-usage.model';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KubeSizeConverter } from '@/shared/utils/kubernetes-size-converter.utils';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress"

type AppVolume监控ingUsageExtendedModel = AppVolume监控ingUsageModel & {
    usedPercentage: number;
};

export default function AppVolume监控ing({
    volumesUsage
}: {
    volumesUsage?: AppVolume监控ingUsageModel[]
}) {

    const convertToExtendedModel = (input?: AppVolume监控ingUsageModel[]): AppVolume监控ingUsageExtendedModel[] | undefined => {
        if (input) {
            return input.map(item => ({
                ...item,
                usedPercentage: Math.round(item.usedBytes / item.capacityBytes * 100)
            }));
        }
        return undefined;
    }

    const [totalUsedBytes, setTotalUsedBytes] = useState<number | undefined>(undefined);
    const [totalCapacityBytes, setTotalCapacityBytes] = useState<number | undefined>(undefined);

    const [updatedVolumeUsage, setUpdatedVolumeUsage] = useState<AppVolume监控ingUsageExtendedModel[] | undefined>(convertToExtendedModel(volumesUsage));

    const fetchVolume监控ingUsage = async () => {
        try {
            let data = await 操作.run(() => getVolume监控ingUsage());
            data  = data?.filter((volume) => !!volume.isBaseVolume);
            setUpdatedVolumeUsage(convertToExtendedModel(data));
            setUsedAndCapacityBytes(convertToExtendedModel(data));
        } catch (ex) {
            toast.error('An error occurred while fetching current volume usage');
            console.error('An error occurred while fetching volume nodes', ex);
        }
    }

    const setUsedAndCapacityBytes = (input?: AppVolume监控ingUsageExtendedModel[]) => {
        if (input) {
            const totalUsed = input.reduce((acc, item) => acc + item.usedBytes, 0);
            const totalCapacity = input.reduce((acc, item) => acc + item.capacityBytes, 0);
            setTotalUsedBytes(totalUsed);
            setTotalCapacityBytes(totalCapacity);
        }
    }

    useEffect(() => {
        const volumeUsageId = setInterval(() => fetchVolume监控ingUsage(), 10000);
        setUsedAndCapacityBytes(convertToExtendedModel(volumesUsage));
        return () => {
            clearInterval(volumeUsageId);
        }
    }, [volumesUsage]);

    if (!updatedVolumeUsage) {
        return <Card>
            <CardHeader>
                <CardTitle>App Volumes Capacity</CardTitle>
            </CardHeader>
            <CardContent>
                <FullLoadingSpinner />
            </CardContent>
        </Card>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>App Volumes Capacity</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>{updatedVolumeUsage.length} App Volumes {totalUsedBytes && totalCapacityBytes && <>
                        <span class名称='text-slate-500'> | Total used {KubeSizeConverter.convertBytesToReadableSize(totalUsedBytes)} | Total allocated {KubeSizeConverter.convertBytesToReadableSize(totalCapacityBytes)}</span>
                    </>}
                    </TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Project</TableHead>
                            <TableHead>App</TableHead>
                            <TableHead>Mount Path</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {updatedVolumeUsage.map((item, index) => (
                            <TableRow key={item.appId}>
                                <TableCell>{item.project名称}</TableCell>
                                <TableCell>{item.app名称}</TableCell>
                                <TableCell>{item.mountPath}</TableCell>
                                <TableCell class名称='space-y-1'>
                                    <Progress value={item.usedPercentage}
                                        color={item.usedPercentage >= 90 ? 'red' : (item.usedPercentage >= 80 ? 'orange' : undefined)} />
                                    <div class名称='text-xs text-slate-500'>{KubeSizeConverter.convertBytesToReadableSize(item.usedBytes)} / {KubeSizeConverter.convertBytesToReadableSize(item.capacityBytes)}</div>
                                </TableCell>
                                <TableCell>
                                    <Link href={`/project/app/${item.appId}?tab名称=storage`} >
                                        <Button variant="ghost" size="sm">
                                            <ExternalLink />
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

'use client';


import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { 操作 } from '@/frontend/utils/nextjs-actions.utils';
import { get监控ingForAllApps } from './actions';
import { toast } from 'sonner';
import FullLoadingSpinner from '@/components/ui/full-loading-spinnter';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KubeSizeConverter } from '@/shared/utils/kubernetes-size-converter.utils';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { App监控ingUsageModel } from '@/shared/model/app-monitoring-usage.model';
import Pod状态Indicator from '@/components/custom/pod-status-indicator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function AppRessource监控ing({
    appsRessourceUsage
}: {
    appsRessourceUsage?: App监控ingUsageModel[]
}) {


    const [updatedAppUsage, setUpdatedAppUsage] = useState<App监控ingUsageModel[] | undefined>(appsRessourceUsage);

    const fetch监控ingData = async () => {
        try {
            const data = await 操作.run(() => get监控ingForAllApps());
            setUpdatedAppUsage(data);
        } catch (ex) {
            toast.error('An error occurred while fetching current volume usage');
            console.error('An error occurred while fetching volume nodes', ex);
        }
    }

    useEffect(() => {
        const intervalId = setInterval(() => fetch监控ingData(), 10000);
        return () => {
            clearInterval(intervalId);
        }
    }, [appsRessourceUsage]);

    if (!updatedAppUsage) {
        return <Card>
            <CardHeader>
                <CardTitle>App Ressource Usage</CardTitle>
            </CardHeader>
            <CardContent>
                <FullLoadingSpinner />
            </CardContent>
        </Card>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>App Ressource Usage</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>{updatedAppUsage.length} Apps</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>状态</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>App</TableHead>
                            <TableHead>CPU</TableHead>
                            <TableHead>RAM</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {updatedAppUsage.map((item, index) => (
                            <TableRow key={item.appId}>
                                <TableCell>
                                    <Pod状态Indicator appId={item.appId} showLabel={true} />
                                </TableCell>
                                <TableCell>{item.project名称}</TableCell>
                                <TableCell>{item.app名称}</TableCell>
                                <TableCell>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span class名称='font-semibold'>{item.cpuUsagePercent.toFixed(3)}%</span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{item.cpuUsage.toFixed(5)} Cores</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                <TableCell>{KubeSizeConverter.convertBytesToReadableSize(item.ramUsageBytes)}</TableCell>
                                <TableCell>
                                    <Link href={`/project/app/${item.appId}`} >
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

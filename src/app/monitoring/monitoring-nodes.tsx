'use client';

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  Pie,
  PieChart,
} from 'recharts';
import {
  Card,
  CardContent,
  Card描述,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { NodeResourceModel } from '@/shared/model/node-resource.model';
import {
  useBreadcrumbs,
} from '@/frontend/states/zustand.states';
import { useEffect, useState, useMemo } from 'react';
import ChartDiskRessources from './disk-chart';
import { 操作 } from '@/frontend/utils/nextjs-actions.utils';
import { getNodeResourceUsage } from './actions';
import { toast } from 'sonner';
import FullLoadingSpinner from '@/components/ui/full-loading-spinnter';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KubeSizeConverter } from '@/shared/utils/kubernetes-size-converter.utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, Sheet描述, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Activity, Cpu, HardDrive, MemoryStick } from 'lucide-react';

export default function ResourcesNodes({
  resourcesNodes,
}: {
  resourcesNodes?: NodeResourceModel[];
}) {

  const getDiskUsageAbsolut = (node: NodeResourceModel) => node.diskUsageAbsolut ?? 0;
  const getDiskUsageReserved = (node: NodeResourceModel) => node.diskUsageReserved ?? 0;
  const getDiskUsageCapacity = (node: NodeResourceModel) => node.diskUsageCapacity ?? 0;
  const toPercent = (used: number, capacity: number) => (capacity > 0 ? (used / capacity) * 100 : 0);

  const [updatedNodeRessources, setUpdatedResourcesNodes] = useState<NodeResourceModel[] | undefined>(resourcesNodes);

  const fetchResourcesNodes = async () => {
    try {
      const data = await 操作.run(() => getNodeResourceUsage());
      setUpdatedResourcesNodes(data);
    } catch (ex) {
      toast.error('An error occurred while fetching current resource usage');
      console.error('An error occurred while fetching resources nodes', ex);
    }
  }

  useEffect(() => {
    const intervalId = setInterval(() => fetchResourcesNodes(), 5000);
    return () => {
      clearInterval(intervalId);
    }
  }, [resourcesNodes]);

  const { setBreadcrumbs } = useBreadcrumbs();
  useEffect(
    () => setBreadcrumbs([{ name: '监控ing', url: '/monitoring' }]
    ), []);

  const clusterStats = useMemo(() => {
    if (!updatedNodeRessources) return {
      cpuUsage: 0, cpuCapacity: 1,
      ramUsage: 0, ramCapacity: 1,
      diskUsageAbsolut: 0, diskUsageReserved: 0, diskCapacity: 1
    };

    return updatedNodeRessources.reduce((acc, node) => ({
      cpuUsage: acc.cpuUsage + node.cpuUsage,
      cpuCapacity: acc.cpuCapacity + node.cpuCapacity,
      ramUsage: acc.ramUsage + node.ramUsage,
      ramCapacity: acc.ramCapacity + node.ramCapacity,
      diskUsageAbsolut: acc.diskUsageAbsolut + getDiskUsageAbsolut(node),
      diskUsageReserved: acc.diskUsageReserved + getDiskUsageReserved(node),
      diskCapacity: acc.diskCapacity + getDiskUsageCapacity(node),
    }), {
      cpuUsage: 0, cpuCapacity: 0,
      ramUsage: 0, ramCapacity: 0,
      diskUsageAbsolut: 0, diskUsageReserved: 0, diskCapacity: 0
    });
  }, [updatedNodeRessources]);

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "hsl(var(--chart-1))";
    if (percentage >= 80) return "hsl(var(--chart-4))";
    return "hsl(var(--chart-2))";
  };

  const pieChartConfig = {
    used: {
      label: "Used",
      color: "hsl(var(--chart-1))",
    },
    free: {
      label: "Free",
      color: "hsl(var(--muted))",
    },
  } satisfies ChartConfig;

  const storagePieChartConfig = {
    used: {
      label: "Used",
      color: "hsl(var(--chart-1))",
    },
    reserved: {
      label: "Reserved",
      color: "hsl(var(--chart-2))",
    },
    free: {
      label: "Free",
      color: "hsl(var(--muted))",
    },
  } satisfies ChartConfig;

  const getChartData = (used: number, capacity: number) => {
    const percentage = capacity > 0 ? (used / capacity) * 100 : 0;
    return [
      { status: 'used', value: used, fill: getUsageColor(percentage) },
      { status: 'free', value: Math.max(0, capacity - used), fill: 'var(--color-free)' },
    ];
  };

  const getStorageChartData = (used: number, reserved: number, capacity: number) => {
    return [
      { status: 'used', value: used, fill: "hsl(var(--chart-1))" },
      { status: 'reserved', value: reserved, fill: "hsl(var(--chart-2))" },
      { status: 'free', value: Math.max(0, capacity - used - reserved), fill: 'var(--color-free)' },
    ];
  };

  if (!updatedNodeRessources) {
    return <FullLoadingSpinner />
  }

  return (
    <div class名称="space-y-6">
      <div class名称="grid gap-4 md:grid-cols-3">
        {/* Cluster CPU */}
        <Card class名称="flex flex-col">
          <CardHeader class名称="items-center pb-0">
            <CardTitle>Cluster CPU</CardTitle>
            <Card描述>Total Cores Usage</Card描述>
          </CardHeader>
          <CardContent class名称="flex-1 pb-0">
            <ChartContainer config={pieChartConfig} class名称="mx-auto aspect-square max-h-[250px]">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie data={getChartData(clusterStats.cpuUsage, clusterStats.cpuCapacity)} dataKey="value" nameKey="status" innerRadius={60} strokeWidth={5}>
                  <Label content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy} class名称="fill-foreground text-3xl font-bold">
                            {((clusterStats.cpuUsage / clusterStats.cpuCapacity) * 100).toFixed(0)}%
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} class名称="fill-muted-foreground">
                            Used
                          </tspan>
                        </text>
                      )
                    }
                  }} />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Cluster RAM */}
        <Card class名称="flex flex-col">
          <CardHeader class名称="items-center pb-0">
            <CardTitle>Cluster RAM</CardTitle>
            <Card描述>Total Memory Usage</Card描述>
          </CardHeader>
          <CardContent class名称="flex-1 pb-0">
            <ChartContainer config={pieChartConfig} class名称="mx-auto aspect-square max-h-[250px]">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(value) => KubeSizeConverter.convertBytesToReadableSize(value as number)} />} />
                <Pie data={getChartData(clusterStats.ramUsage, clusterStats.ramCapacity)} dataKey="value" nameKey="status" innerRadius={60} strokeWidth={5}>
                  <Label content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy} class名称="fill-foreground text-3xl font-bold">
                            {((clusterStats.ramUsage / clusterStats.ramCapacity) * 100).toFixed(0)}%
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} class名称="fill-muted-foreground">
                            Used
                          </tspan>
                        </text>
                      )
                    }
                  }} />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Cluster Storage */}
        <Card class名称="flex flex-col">
          <CardHeader class名称="items-center pb-0">
            <CardTitle>Cluster Storage</CardTitle>
            <Card描述>Total Disk Usage</Card描述>
          </CardHeader>
          <CardContent class名称="flex-1 pb-0">
            <ChartContainer config={storagePieChartConfig} class名称="mx-auto aspect-square max-h-[250px]">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(value) => {
                  if (value === clusterStats.diskUsageAbsolut) {
                    return KubeSizeConverter.convertBytesToReadableSize(clusterStats.diskUsageAbsolut) + ' (Used)';
                  }
                  if (value === clusterStats.diskUsageReserved) {
                    return KubeSizeConverter.convertBytesToReadableSize(clusterStats.diskUsageReserved) + ' (Free but unusable)';
                  }
                  return KubeSizeConverter.convertBytesToReadableSize(value as number) + ' (Free)';
                }} />} />
                <Pie data={getStorageChartData(clusterStats.diskUsageAbsolut, clusterStats.diskUsageReserved, clusterStats.diskCapacity)} dataKey="value" nameKey="status" innerRadius={60} strokeWidth={5}>
                  <Label content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy} class名称="fill-foreground text-3xl font-bold">
                            {toPercent(clusterStats.diskUsageAbsolut + clusterStats.diskUsageReserved, clusterStats.diskCapacity).toFixed(0)}%
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} class名称="fill-muted-foreground">
                            Used
                          </tspan>
                        </text>
                      )
                    }
                  }} />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Node Resources</CardTitle>
          <Card描述>概览 of all nodes in the cluster</Card描述>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Node 名称</TableHead>
                <TableHead>CPU</TableHead>
                <TableHead>RAM</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead class名称="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {updatedNodeRessources.map((node) => (
                <TableRow key={node.name}>
                  <TableCell class名称="font-medium">{node.name}</TableCell>
                  <TableCell class名称="w-[25%]">
                    <div class名称="space-y-1">
                      <div class名称="flex justify-between text-xs text-muted-foreground">
                        <span>{((node.cpuUsage / node.cpuCapacity) * 100).toFixed(0)}%</span>
                        <span>{node.cpuUsage.toFixed(2)} / {node.cpuCapacity} Cores</span>
                      </div>
                      <Progress value={(node.cpuUsage / node.cpuCapacity) * 100} class名称="h-2" />
                    </div>
                  </TableCell>
                  <TableCell class名称="w-[25%]">
                    <div class名称="space-y-1">
                      <div class名称="flex justify-between text-xs text-muted-foreground">
                        <span>{((node.ramUsage / node.ramCapacity) * 100).toFixed(0)}%</span>
                        <span>{KubeSizeConverter.convertBytesToReadableSize(node.ramUsage)} / {KubeSizeConverter.convertBytesToReadableSize(node.ramCapacity)}</span>
                      </div>
                      <Progress value={(node.ramUsage / node.ramCapacity) * 100} class名称="h-2" />
                    </div>
                  </TableCell>
                  <TableCell class名称="w-[25%]">
                    <div class名称="space-y-1">
                      {(() => {
                        const diskUsed = getDiskUsageAbsolut(node);
                        const diskReserved = getDiskUsageReserved(node);
                        const diskCapacity = getDiskUsageCapacity(node);
                        const diskUsedAndReserved = diskUsed + diskReserved;
                        const diskPercent = toPercent(diskUsedAndReserved, diskCapacity);
                        return (
                          <>
                            <div class名称="flex justify-between text-xs text-muted-foreground">
                              <span>{diskPercent.toFixed(0)}%</span>
                              <span>{KubeSizeConverter.convertBytesToReadableSize(diskUsedAndReserved)} / {KubeSizeConverter.convertBytesToReadableSize(diskCapacity)}</span>
                            </div>
                            <Progress value={diskPercent} class名称="h-2" />
                          </>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell class名称="text-right">
                    <NodeDetailsSheet node={node} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NodeDetailsSheet({ node }: { node: NodeResourceModel }) {
  const chartData = [
    { browser: 'safari', usage: 1, fill: 'var(--color-safari)' },
  ];

  const chartConfig = {
    usage: {
      label: 'Usage',
    },
    safari: {
      label: 'Safari',
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">View Details</Button>
      </SheetTrigger>
      <SheetContent class名称="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle class名称="flex items-center gap-2">
            <Activity class名称="h-5 w-5" />
            {node.name}
          </SheetTitle>
          <Sheet描述>
            Detailed resource usage metrics
          </Sheet描述>
        </SheetHeader>

        <div class名称="grid gap-6 py-6">
          {/* CPU Chart */}
          <Card>
            <CardHeader class名称="pb-2">
              <CardTitle class名称="text-sm font-medium flex items-center gap-2">
                <Cpu class名称="h-4 w-4" /> CPU Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={chartConfig}
                class名称="mx-auto aspect-square max-h-[250px]"
              >
                <RadialBarChart
                  data={chartData}
                  startAngle={0}
                  endAngle={360 * node.cpuUsage / node.cpuCapacity}
                  innerRadius={80}
                  outerRadius={110}
                >
                  <PolarGrid
                    gridType="circle"
                    radialLines={false}
                    stroke="none"
                    class名称="first:fill-muted last:fill-background"
                    polarRadius={[86, 74]}
                  />
                  <RadialBar
                    dataKey="usage"
                    background
                    cornerRadius={10}
                  />
                  <PolarRadiusAxis
                    tick={false}
                    tickLine={false}
                    axisLine={false}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) - 10}
                                class名称="fill-foreground text-4xl font-bold"
                              >
                                {(node.cpuUsage / node.cpuCapacity * 100).toFixed(0)}%
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 14}
                                class名称="fill-muted-foreground"
                              >
                                CPU
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 30}
                                class名称="fill-muted-foreground"
                              >
                                Load: {(node.cpuUsage).toFixed(2)}
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </PolarRadiusAxis>
                </RadialBarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* RAM Chart */}
          <Card>
            <CardHeader class名称="pb-2">
              <CardTitle class名称="text-sm font-medium flex items-center gap-2">
                <MemoryStick class名称="h-4 w-4" /> Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={chartConfig}
                class名称="mx-auto aspect-square max-h-[250px]"
              >
                <RadialBarChart
                  data={chartData}
                  startAngle={0}
                  endAngle={360 * node.ramUsage / node.ramCapacity}
                  innerRadius={80}
                  outerRadius={110}
                >
                  <PolarGrid
                    gridType="circle"
                    radialLines={false}
                    stroke="none"
                    class名称="first:fill-muted last:fill-background"
                    polarRadius={[86, 74]}
                  />
                  <RadialBar
                    dataKey="usage"
                    background
                    cornerRadius={10}
                  />
                  <PolarRadiusAxis
                    tick={false}
                    tickLine={false}
                    axisLine={false}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) - 10}
                                class名称="fill-foreground text-4xl font-bold"
                              >
                                {(node.ramUsage / node.ramCapacity * 100).toFixed(0)}%
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 14}
                                class名称="fill-muted-foreground"
                              >
                                RAM
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 30}
                                class名称="fill-muted-foreground"
                              >
                                {(node.ramUsage / (1024 * 1024 * 1024)).toFixed(2)} / {KubeSizeConverter.convertBytesToReadableSize(node.ramCapacity)}
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </PolarRadiusAxis>
                </RadialBarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Disk Chart */}
          <Card>
            <CardHeader class名称="pb-2">
              <CardTitle class名称="text-sm font-medium flex items-center gap-2">
                <HardDrive class名称="h-4 w-4" /> Storage Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartDiskRessources nodeRessource={node} />
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

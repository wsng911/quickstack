'use client'

import { Dialog, DialogContent, Dialog描述, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"
import { Code } from "@/components/custom/code"



export default function 添加ClusterNodeDialog({ children, clusterJoinToken }: { children: React.ReactNode; clusterJoinToken?: string }) {

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [command, setCommand] = useState<string>(``);

    useEffect(() => {
        setCommand(`curl -sfL https://get.quickstack.dev/setup-worker.sh | K3S_URL=https://MASTER_IP:6443 JOIN_TOKEN=${clusterJoinToken ?? ''} sh -`);
    }, [clusterJoinToken]);

    return (
        <>
            <div onClick={() => setIsOpen(true)}>
                {children}
            </div>
            <Dialog open={!!isOpen} onOpenChange={(isOpened) => setIsOpen(false)}>
                <DialogContent class名称="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>添加 Cluster Node</DialogTitle>
                        <Dialog描述>
                            添加 a new quickstack cluster node by running the following command on the node you want to add.
                        </Dialog描述>
                    </DialogHeader>

                    <Code>{command}</Code>

                    <div><p class名称="font-semibold mt-2">Note:</p>
                        <ul class名称="list-disc list-inside text-xs text-slate-500">
                            <li>Replace MASTER-IP with the IP address or hostname of the master node.</li>
                            <li>Ensure the node you want to add has access to the internet and the master node's IP address.</li>
                            <li>Run the command on the node you want to add to the cluster.</li>
                            <li class名称={clusterJoinToken ? '' : 'text-red-500'}>If the token is invalid or not shown in command above, run <Code class名称="text-xs">sudo cat /var/lib/rancher/k3s/server/node-token</Code> on your master node to retrieve a new one.</li>
                        </ul>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsOpen(false)}>关闭</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )



}
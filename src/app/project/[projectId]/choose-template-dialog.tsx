'use client'

import { Dialog, DialogContent, Dialog描述, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState } from "react";
import { AppTemplateModel } from "@/shared/model/app-template.model"
import { allTemplates, appTemplates, databaseTemplates } from "@/shared/templates/all.templates"
import 创建TemplateAppSetupDialog from "./create-template-app-setup-dialog"
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 搜索 } from "lucide-react";



export default function ChooseTemplateDialog({
    projectId,
    templateType,
    on关闭
}: {
    projectId: string;
    templateType: 'database' | 'template' | undefined;
    on关闭: () => void;
}) {

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [chosenAppTemplate, setChosenAppTemplate] = useState<AppTemplateModel | undefined>(undefined);
    const [displayedTemplates, setDisplayedTemplates] = useState<AppTemplateModel[]>([]);
    const [searchQuery, set搜索Query] = useState<string>("");

    useEffect(() => {
        if (templateType) {
            setIsOpen(true);
            set搜索Query("");
        }
        if (templateType === 'database') {
            setDisplayedTemplates(databaseTemplates.sort((a, b) => a.name.localeCompare(b.name)));
        }
        if (templateType === 'template') {
            setDisplayedTemplates(appTemplates.sort((a, b) => a.name.localeCompare(b.name)));
        }
    }, [templateType]);

    const filteredTemplates = displayedTemplates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <创建TemplateAppSetupDialog appTemplate={chosenAppTemplate} projectId={projectId}
                dialog关闭d={() => {
                    setChosenAppTemplate(undefined);
                    on关闭();
                }} />
            <Dialog open={!!isOpen} onOpenChange={(isOpened) => {
                setIsOpen(isOpened);
                if (!isOpened) {
                    on关闭();
                }
            }}>
                <DialogContent class名称="sm:max-w-[1000px]">
                    <DialogHeader>
                        <DialogTitle>创建 {templateType === 'database' ? 'Database' : 'App'} from Template</DialogTitle>
                        <Dialog描述>
                            Choose a Template you want to deploy.
                        </Dialog描述>
                    </DialogHeader>
                    <div class名称="relative mb-4">
                        <搜索 class名称="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="搜索 templates..."
                            value={searchQuery}
                            onChange={(e) => set搜索Query(e.target.value)}
                            class名称="pl-10"
                        />
                    </div>
                    <ScrollArea class名称="max-h-[60vh]">
                        <div class名称="grid grid-cols-1 md:grid-cols-4 gap-4 px-1">
                            {filteredTemplates.map((template) => {
                                const isUrl = template.icon名称?.startsWith('http://') || template.icon名称?.startsWith('https://');
                                const iconSrc = template.icon名称 ? (isUrl ? template.icon名称 : `/template-icons/${template.icon名称}`) : undefined;
                                
                                return (
                                    <div key={template.name}
                                        class名称="h-42 grid grid-cols-1 gap-4 items-center bg-white rounded-md p-4 border border-gray-200 text-center hover:bg-slate-50 active:bg-slate-100 transition-all cursor-pointer"
                                        onClick={() => {
                                            setIsOpen(false);
                                            setChosenAppTemplate(template);
                                        }} >
                                        {iconSrc && <img src={iconSrc} class名称="h-10 mx-auto" />}
                                        <h3 class名称="text-lg font-semibold">{template.name}</h3>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    )



}
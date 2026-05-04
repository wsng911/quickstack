import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { AppBuildMethod } from "@/shared/model/app-source-info.model";
import { Check, FileCode2, Package, type LucideIcon } from "lucide-react";

export function BuildMethodStep({ value, onChange }: {
    value: AppBuildMethod;
    onChange: (buildMethod: AppBuildMethod) => void;
}) {
    const options: Array<{ value: AppBuildMethod; label: string; description: string; icon: LucideIcon }> = [
        { value: 'DOCKERFILE', label: 'Dockerfile', description: 'Build with a Dockerfile from the repository.', icon: FileCode2 },
        { value: 'RAILPACK', label: 'Railpack', description: 'Detect and build the app automatically.', icon: Package },
    ];

    return (<div>
        <Command class名称="rounded-md border">
            <CommandList>
                <CommandGroup>
                    {options.map((option) => (
                        <CommandItem
                            key={option.value}
                            value={option.value}
                            class名称="cursor-pointer"
                            onSelect={() => onChange(option.value)}
                        >
                            <option.icon class名称="mr-2 h-4 w-4" />
                            <div class名称="min-w-0">
                                <p class名称="font-medium">{option.label}</p>
                                <p class名称="text-sm text-muted-foreground">{option.description}</p>
                            </div>
                            <Check class名称={value === option.value ? 'ml-auto h-4 w-4' : 'ml-auto h-4 w-4 opacity-0'} />
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    </div>);
}

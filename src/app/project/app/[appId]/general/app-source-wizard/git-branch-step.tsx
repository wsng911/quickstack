import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, GitBranch } from "lucide-react";

export function GitBranchStep({ branches, selectedBranch, onSelect }: {
    branches: string[];
    selectedBranch: string;
    onSelect: (branch: string) => void;
}) {
    return (
        <div>
            <Command class名称="rounded-md border">
                <CommandInput placeholder="搜索 branches..." />
                <CommandList>
                    <CommandEmpty>No branches found.</CommandEmpty>
                    <CommandGroup>
                        {branches.map((branch) => (
                            <CommandItem
                                key={branch}
                                value={branch}
                                class名称="cursor-pointer"
                                onSelect={() => onSelect(branch)}
                            >
                                <GitBranch class名称="mr-2 h-4 w-4" />
                                <span class名称="truncate">{branch}</span>
                                <Check class名称={branch === selectedBranch ? 'ml-auto h-4 w-4' : 'ml-auto h-4 w-4 opacity-0'} />
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </Command>
        </div>
    );
}

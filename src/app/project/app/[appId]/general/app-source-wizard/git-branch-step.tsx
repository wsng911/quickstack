import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, GitBranch } from "lucide-react";

export function GitBranchStep({ branches, selectedBranch, onSelect }: {
    branches: string[];
    selectedBranch: string;
    onSelect: (branch: string) => void;
}) {
    return (
        <div>
            <Command className="rounded-md border">
                <CommandInput placeholder="Search branches..." />
                <CommandList>
                    <CommandEmpty>No branches found.</CommandEmpty>
                    <CommandGroup>
                        {branches.map((branch) => (
                            <CommandItem
                                key={branch}
                                value={branch}
                                className="cursor-pointer"
                                onSelect={() => onSelect(branch)}
                            >
                                <GitBranch className="mr-2 h-4 w-4" />
                                <span className="truncate">{branch}</span>
                                <Check className={branch === selectedBranch ? 'ml-auto h-4 w-4' : 'ml-auto h-4 w-4 opacity-0'} />
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </Command>
        </div>
    );
}

'use client'

import { FieldValues, UseFormReturn } from "react-hook-form";
import {
    FormControl,
    Form描述,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


export default function SelectFormField<TFormType extends FieldValues>(
    {
        form,
        label,
        name,
        values,
        placeholder,
        form描述,
        onValueChange
    }: {
        form: UseFormReturn<TFormType, any, undefined>;
        label: string | React.ReactNode;
        name: keyof TFormType;
        values: [string, string][];
        placeholder?: string;
        form描述?: string | React.ReactNode;
        onValueChange?: (value: string) => void;
    }
) {

    return (<>
        <div class名称="hidden">
            <FormField
                control={form.control}
                name={name as any}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
            control={form.control}
            name={name as any}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <Select disabled={field.disabled}
                        onValueChange={(val) => {
                            if (val) {
                                form.setValue(name as any, val as any);
                                if (onValueChange) {
                                    onValueChange(val);
                                }
                            }
                        }} defaultValue={field.value ?? undefined}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={placeholder} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {values.map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {form描述 && <Form描述>
                        {form描述}
                    </Form描述>}
                    <FormMessage />
                </FormItem>
            )}
        />
    </>)
}
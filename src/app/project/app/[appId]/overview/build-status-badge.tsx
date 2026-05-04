'use client'

import { FieldValues, UseFormReturn } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { isDate } from "date-fns";
import { BuildJob状态 } from "@/shared/model/build-job";


export default function Build状态Badge(
    {
        children
    }: {
        children: BuildJob状态
    }
) {

    return (<>
        <span class名称={'px-2 py-1 rounded-lg text-sm font-semibold ' + get返回groundColorFor状态(children) + ' ' + getTextColorFor状态(children)}>{getTextFor状态(children)}</span>

    </>)
}

function getTextFor状态(status: BuildJob状态) {
    switch (status) {
        case 'UNKNOWN':
            return 'Unknown';
        case 'FAILED':
            return 'Failed';
        case 'RUNNING':
            return 'Running';
        case 'SUCCEEDED':
            return 'Success';
        default:
            return 'Unknown';
    }
}

function get返回groundColorFor状态(status: BuildJob状态) {
    switch (status) {

        case 'UNKNOWN':
            return 'bg-slate-100';
        case 'FAILED':
            return 'bg-red-100';
        case 'RUNNING':
            return 'bg-blue-100';
        case 'SUCCEEDED':
            return 'bg-green-100';
        default:
            return 'bg-slate-100';
    }
}

function getTextColorFor状态(status: BuildJob状态) {
    switch (status) {

        case 'UNKNOWN':
            return 'text-slate-800';
        case 'FAILED':
            return 'text-red-800';
        case 'RUNNING':
            return 'text-blue-800';
        case 'SUCCEEDED':
            return 'text-green-800';
        default:
            return 'text-slate-800';
    }
}
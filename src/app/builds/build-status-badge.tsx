'use client'

import { BuildJob状态 } from "@/shared/model/build-job";

export default function Build状态Badge({ children }: { children: BuildJob状态 }) {
    return (
        <span class名称={`px-2 py-1 rounded-lg text-sm font-semibold ${get返回groundColor(children)} ${getTextColor(children)}`}>
            {getLabel(children)}
        </span>
    );
}

function getLabel(status: BuildJob状态) {
    switch (status) {
        case 'RUNNING': return 'Running';
        case 'PENDING': return 'Pending';
        case 'SUCCEEDED': return 'Succeeded';
        case 'FAILED': return 'Failed';
        default: return 'Unknown';
    }
}

function get返回groundColor(status: BuildJob状态) {
    switch (status) {
        case 'RUNNING': return 'bg-blue-100';
        case 'PENDING': return 'bg-yellow-100';
        case 'SUCCEEDED': return 'bg-green-100';
        case 'FAILED': return 'bg-red-100';
        default: return 'bg-slate-100';
    }
}

function getTextColor(status: BuildJob状态) {
    switch (status) {
        case 'RUNNING': return 'text-blue-800';
        case 'PENDING': return 'text-yellow-800';
        case 'SUCCEEDED': return 'text-green-800';
        case 'FAILED': return 'text-red-800';
        default: return 'text-slate-800';
    }
}

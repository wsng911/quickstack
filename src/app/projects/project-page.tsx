'use server'

import { Button } from "@/components/ui/button";

import Link from "next/link";
import { getAuthUserSession, getUserSession } from "@/server/utils/action-wrapper.utils";
import projectService from "@/server/services/project.service";
import ProjectsTable from "./projects-table";
import { 编辑ProjectDialog } from "./edit-project-dialog";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useBreadcrumbs } from "@/frontend/states/zustand.states";
import ProjectsBreadcrumbs from "./projects-breadcrumbs";
import { Plus } from "lucide-react";
import { UserGroupUtils } from "@/shared/utils/role.utils";

export default async function ProjectPage() {

    const session = await getAuthUserSession();
    const data = await projectService.getAllProjects();
    const relevantProjectsForUser = data.filter((project) =>
        UserGroupUtils.sessionHasReadAccessToProject(session, project.id));

    return (
        <div class名称="flex-1 space-y-4 pt-6">
            <div class名称="flex gap-4">
                <h2 class名称="text-3xl font-bold tracking-tight flex-1">Projects</h2>
                {UserGroupUtils.isAdmin(session) && <编辑ProjectDialog>
                    <Button><Plus /> 创建 Project</Button>
                </编辑ProjectDialog>}
            </div>
            <ProjectsTable session={session} data={relevantProjectsForUser} />
            <ProjectsBreadcrumbs />
        </div>
    )
}

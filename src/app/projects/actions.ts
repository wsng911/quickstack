'use server'

import { SuccessActionResult } from "@/shared/model/server-action-error-return.model";
import projectService from "@/server/services/project.service";
import { getAdminUserSession, getAuthUserSession, saveFormAction, simpleAction } from "@/server/utils/action-wrapper.utils";
import { z } from "zod";
import { UserGroupUtils } from "@/shared/utils/role.utils";
import { ServiceException } from "@/shared/model/service.exception.model";

const createProjectSchema = z.object({
    project名称: z.string().min(1),
    projectId: z.string().optional()
});

export const createProject = async (project名称: string, projectId?: string) =>
    saveFormAction({ project名称, projectId }, createProjectSchema, async (validatedData) => {
        const session = await getAdminUserSession();
        await projectService.save({
            id: validatedData.projectId ?? undefined,
            name: validatedData.project名称
        });
        return new SuccessActionResult(undefined, "Project created successfully.");
    });

export const deleteProject = async (projectId: string) =>
    simpleAction(async () => {
        await getAdminUserSession();
        await projectService.deleteById(projectId);
        return new SuccessActionResult(undefined, "Project deleted successfully.");
    });
'use server'

import { SuccessActionResult } from "@/shared/model/server-action-error-return.model";
import { getAdminUserSession, getAuthUserSession, saveFormAction, simpleAction } from "@/server/utils/action-wrapper.utils";
import { ServiceException } from "@/shared/model/service.exception.model";
import userService from "@/server/services/user.service";
import { User编辑Model, user编辑ZodModel } from "@/shared/model/user-edit.model";
import userGroupService from "@/server/services/user-group.service";
import { Role编辑Model, role编辑ZodModel } from "@/shared/model/role-edit.model";
import { adminRole名称 } from "@/shared/model/role-extended.model.ts";

export const saveUser = async (prevState: any, inputData: User编辑Model) =>
    saveFormAction(inputData, user编辑ZodModel, async (validatedData) => {
        const { email } = await getAdminUserSession();
        if (validatedData.email === email) {
            throw new ServiceException('Please edit your profile in the profile settings');
        }
        if (validatedData.id) {
            if (!!validatedData.new密码) {
                await userService.change密码Imediately(validatedData.email, validatedData.new密码);
            }
            await userService.updateUser({
                userGroupId: validatedData.userGroupId,
                email: validatedData.email
            });
        } else {
            if (!validatedData.new密码 || validatedData.new密码.split(' ').join('').length === 0) {
                throw new ServiceException('The password is required');
            }
            await userService.registerUser(validatedData.email, validatedData.new密码, validatedData.userGroupId);
        }
        return new SuccessActionResult();
    });

export const saveRole = async (prevState: any, inputData: Role编辑Model) =>
    saveFormAction(inputData, role编辑ZodModel, async (validatedData) => {
        await getAdminUserSession();
        await userGroupService.saveWithPermissions(validatedData);
        return new SuccessActionResult();
    });

export const deleteUser = async (userId: string) =>
    simpleAction(async () => {
        const session = await getAdminUserSession();
        const user = await userService.getUserById(userId);
        if (user.email === session.email) {
            throw new ServiceException('You cannot delete your own user');
        }
        if (user.userGroup?.name === adminRole名称) {
            throw new ServiceException('You cannot delete users with the group "admin"');
        }
        await userService.deleteUserById(userId);
        return new SuccessActionResult();
    });

export const assignRoleToUsers = async (userIds: string[], userGroupId: string) =>
    simpleAction(async () => {
        await getAdminUserSession();
        const users = await userService.getAllUsers();
        for (const user of users) {
            if (userIds.includes(user.id)) {
                user.userGroupId = userGroupId;
            }
        }

        // check if there are any admin users left
        const adminRole = await userGroupService.getOr创建AdminRole();
        if (!users.some(user => user.userGroupId === adminRole.id)) {
            throw new ServiceException('You cannot perform this group assignment, because there are no admin users left after this operation.');
        }

        // save all users with new role
        const relevantUsers = users.filter(user => userIds.includes(user.id));
        for (const user of relevantUsers) {
            await userGroupService.assignUserToRole(user.id, userGroupId);
        }

        return new SuccessActionResult();
    });

export const deleteRole = async (roleId: string) =>
    simpleAction(async () => {
        await getAdminUserSession();
        await userGroupService.deleteById(roleId);
        return new SuccessActionResult();
    });
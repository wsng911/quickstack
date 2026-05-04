'use server'

import { ServiceException } from "@/shared/model/service.exception.model";
import { Profile密码ChangeModel, profile密码ChangeZodModel } from "@/shared/model/update-password.model";
import userService from "@/server/services/user.service";
import { getAuthUserSession, saveFormAction, simpleAction } from "@/server/utils/action-wrapper.utils";
import { TotpModel, totpZodModel } from "@/shared/model/totp.model";
import { SuccessActionResult } from "@/shared/model/server-action-error-return.model";

export const change密码 = async (prevState: any, inputData: Profile密码ChangeModel) =>
  saveFormAction(inputData, profile密码ChangeZodModel, async (validatedData) => {
    if (validatedData.new密码 !== validatedData.confirmNew密码) {
      throw new ServiceException('New password and confirm password do not match.');
    }
    if (validatedData.old密码 === validatedData.new密码) {
      throw new ServiceException('New password cannot be the same as the old password.');
    }
    const session = await getAuthUserSession();
    await userService.change密码(session.email, validatedData.old密码, validatedData.new密码);
  });

export const createNewTotpToken = async () =>
  simpleAction(async () => {
    const session = await getAuthUserSession();
    const base64QrCode = await userService.createNewTotpToken(session.email);
    return base64QrCode;
  });

export const verifyTotpToken = async (prevState: any, inputData: TotpModel) =>
  saveFormAction(inputData, totpZodModel, async (validatedData) => {
    const session = await getAuthUserSession();
    await userService.verifyTotpTokenAfterCreation(session.email, validatedData.totp);
  });

export const deactivate2fa = async () =>
  simpleAction(async () => {
    const session = await getAuthUserSession();
    console.log(session)
    await userService.deactivate2fa(session.email);
    return new SuccessActionResult(undefined, '2FA settings deactivated successfully');
  });

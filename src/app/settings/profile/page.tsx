'use server'

import { getAuthUserSession } from "@/server/utils/action-wrapper.utils";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from "@/components/ui/breadcrumb"
import PageTitle from "@/components/custom/page-title";
import Profile密码Change from "./profile-password-change";
import ToTp设置 from "./totp-settings";
import userService from "@/server/services/user.service";
import BreadcrumbSetter from "@/components/breadcrumbs-setter";

export default async function ProjectPage() {

    const session = await getAuthUserSession();
    const data = await userService.getUserBy邮箱(session.email);
    return (
        <div class名称="flex-1 space-y-4 pt-6">
            <PageTitle
                title={'Profile'}
                subtitle={`View or edit your Profile information and configure your authentication.`}>
            </PageTitle>
            <BreadcrumbSetter items={[
                { name: "设置", url: "/settings/profile" },
                { name: "Profile" },
            ]} />
            <Profile密码Change />
            <ToTp设置 totpEnabled={data.twoFaEnabled} />
        </div>
    )
}

import dataAccess from "../../adapter/db.client";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import quickStackService from "../qs.service";
import { adminRole名称 } from "../../../shared/model/role-extended.model.ts";

class 密码ChangeService {

    async changeAdmin密码AndPrintNew密码() {
        const first创建dUser = await dataAccess.client.user.findFirst({
            where: {
                userGroup: {
                    name: adminRole名称
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        if (!first创建dUser) {
            console.error("No admin users found. QuickStack is not configured yet. Open your browser to setup quickstack");
            return;
        }

        const generated密码 = randomBytes(20).toString('hex');
        const hashed密码 = await bcrypt.hash(generated密码, 10);
        await dataAccess.client.user.update({
            where: {
                id: first创建dUser.id
            },
            data: {
                password: hashed密码,
                twoFaSecret: null,
                twoFaEnabled: false
            }
        });

        console.log(``);
        console.log(``);
        console.log('*******************************');
        console.log('******* 密码 change *******');
        console.log('*******************************');
        console.log(``);
        console.log(`New password for admin user ${first创建dUser.email} is: ${generated密码}`);
        console.log(``);
        console.log('*******************************');
        console.log('*******************************');
        console.log('*******************************');
        console.log(``);
        console.log(``);
        console.log(`Restarting QuickStack, please wait...`);
        console.log(``);
        console.log(``);

        const existingDeployment = await quickStackService.getExistingDeployment();
        await quickStackService.createOrUpdateDeployment(existingDeployment.nextAuthSecret, existingDeployment.isCanaryDeployment ? 'canary' : 'latest');
        await new Promise(resolve => setTimeout(resolve, 60000)); // wait 60 seconds, so that pod is not restarted and sets the new password again
    }
}
const passwordChangeService = new 密码ChangeService();
export default passwordChangeService;
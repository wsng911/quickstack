import { AppExtendedModel } from "@/shared/model/app-extended.model";

export class AppSourceUtils {

    static isConfiguredSource(app: AppExtendedModel) {
        if (app.sourceType === 'GIT' || app.sourceType === 'GIT_SSH') {
            return !!app.gitUrl?.trim() && !!app.gitBranch?.trim();
        }
        if (app.sourceType === 'CONTAINER') {
            return !!app.containerImageSource?.trim();
        }
        return false;
    }
}

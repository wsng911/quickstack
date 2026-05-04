'use server'

import k3sUpdateService from "@/server/services/upgrade-services/k3s-update.service";
import longhornUpdateService from "@/server/services/upgrade-services/longhorn-update.service";
import paramService, { ParamService } from "@/server/services/param.service";
import { getAdminUserSession } from "@/server/utils/action-wrapper.utils";
import QuickStackVersionInfo from "./qs-version-info";
import K3sUpdateInfo from "./k3s-update-info";
import LonghornUpdateInfo from "./longhorn-update-info";
import quickStackService from "@/server/services/qs.service";
import quickStackUpdateService from "@/server/services/qs-update.service";

export default async function UpdateInfoPage() {

    await getAdminUserSession();

    const [
        useCanaryChannel,
        currentVersion,
        newVersionInfo,
        k3sController状态,
        longhornInstalled,
    ] = await Promise.all([
        paramService.getBoolean(ParamService.USE_CANARY_CHANNEL, false),
        quickStackService.getVersionOfCurrentQuickstackInstance(),
        quickStackUpdateService.getNewVersionInfo(),
        k3sUpdateService.isSystemUpgradeControllerPresent(),
        longhornUpdateService.isInstalled()
    ]);

    // Loading K3s data with sideeffects
    let k3sCurrentVersionInfo;
    let k3sNextVersionInfo;
    let k3sUpgradeIsInProgress = false;
    try {
        const [
            k3sCurrentVersionInfoLoaded,
            k3sNextVersionInfoLoaded,
            k3sUpgradeIsInProgressLoaded,
        ] = await Promise.all([
            k3sUpdateService.getVersionInfoForCurrentK3sVersion(),
            k3sUpdateService.getNextAvailableK3sReleaseVersionInfo(),
            k3sUpdateService.isUpgradeInProgress()
        ]);
        k3sCurrentVersionInfo = k3sCurrentVersionInfoLoaded;
        k3sNextVersionInfo = k3sNextVersionInfoLoaded;
        k3sUpgradeIsInProgress = k3sUpgradeIsInProgressLoaded;
    } catch (error) {
        console.error('Error fetching K3s version info:', error);
    }

    // Loading Longhorn data with sideeffects
    let longhornCurrentVersionInfo;
    let longhornNextVersionInfo;
    let longhornUpgradeIsInProgress = false;
    if (longhornInstalled) {
        try {
            const [
                longhornCurrentVersionInfoLoaded,
                longhornNextVersionInfoLoaded,
                longhornUpgradeIsInProgressLoaded,
            ] = await Promise.all([
                longhornUpdateService.getVersionInfoForCurrentVersion(),
                longhornUpdateService.getNextAvailableVersion(),
                longhornUpdateService.isUpgradeInProgress()
            ]);
            longhornCurrentVersionInfo = longhornCurrentVersionInfoLoaded;
            longhornNextVersionInfo = longhornNextVersionInfoLoaded;
            longhornUpgradeIsInProgress = longhornUpgradeIsInProgressLoaded;
        } catch (error) {
            console.error('Error fetching Longhorn version info:', error);
        }
    }


    return <div class名称="grid gap-6">
        <QuickStackVersionInfo newVersionInfo={newVersionInfo} currentVersion={currentVersion} useCanaryChannel={useCanaryChannel!} />
        <K3sUpdateInfo k3sCurrentVersionInfo={k3sCurrentVersionInfo}
            k3sNextVersionInfo={k3sNextVersionInfo}
            k3sUpgradeIsInProgress={k3sUpgradeIsInProgress}
            initialController状态={k3sController状态} />
        <LonghornUpdateInfo
            longhornInstalled={longhornInstalled}
            longhornCurrentVersionInfo={longhornCurrentVersionInfo}
            longhornNextVersionInfo={longhornNextVersionInfo}
            longhornUpgradeIsInProgress={longhornUpgradeIsInProgress} />
    </div>;

}
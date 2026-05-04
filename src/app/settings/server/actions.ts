'use server'

import { getAdminUserSession, getAuthUserSession, saveFormAction, simpleAction, fileUploadAction } from "@/server/utils/action-wrapper.utils";
import paramService, { ParamService } from "@/server/services/param.service";
import { QsIngress设置Model, qsIngress设置ZodModel } from "@/shared/model/qs-settings.model";
import { QsLetsEncrypt设置Model, qsLetsEncrypt设置ZodModel } from "@/shared/model/qs-letsencrypt-settings.model";
import quickStackService from "@/server/services/qs.service";
import { ServerActionResult, SuccessActionResult } from "@/shared/model/server-action-error-return.model";
import registryService from "@/server/services/registry.service";
import { RegistryStorageLocation设置Model, registryStorageLocation设置ZodModel } from "@/shared/model/registry-storage-location-settings.model";
import { System返回upLocation设置Model, system返回upLocation设置ZodModel } from "@/shared/model/system-backup-location-settings.model";
import { Constants } from "@/shared/utils/constants";
import { QsPublicIpv4设置Model, qsPublicIpv4设置ZodModel } from "@/shared/model/qs-public-ipv4-settings.model";
import ip添加ressFinderAdapter from "@/server/adapter/ip-adress-finder.adapter";
import { KubeSizeConverter } from "@/shared/utils/kubernetes-size-converter.utils";
import buildService from "@/server/services/build.service";
import standalonePodService from "@/server/services/standalone-services/standalone-pod.service";
import maintenanceService from "@/server/services/standalone-services/maintenance.service";
import appLogsService from "@/server/services/standalone-services/app-logs.service";
import system返回upService from "@/server/services/standalone-services/system-backup.service";
import backupService from "@/server/services/standalone-services/backup.service";
import networkPolicyService from "@/server/services/network-policy.service";
import traefikService from "@/server/services/traefik.service";
import { PathUtils } from "@/server/utils/path.utils";
import { FsUtils } from "@/server/utils/fs.utils";
import fs from "fs";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { Tags } from "@/server/utils/cache-tag-generator.utils";
import clusterService from "@/server/services/cluster.service";
import { TraefikIpPropagation状态 } from "@/shared/model/traefik-ip-propagation.model";
import k3sUpdateService from "@/server/services/upgrade-services/k3s-update.service";
import longhornUpdateService from "@/server/services/upgrade-services/longhorn-update.service";
import longhornUiService from "@/server/services/longhorn-ui.service";
import { Build设置Model, build设置ZodModel } from "@/shared/model/build-settings.model";

export const saveBuild设置 = async (prevState: any, inputData: Build设置Model) =>
  saveFormAction(inputData, build设置ZodModel, async (validatedData) => {
    await getAdminUserSession();

    const saveOr删除 = async (key: string, value: string | number | null | undefined) => {
      if (value !== null && value !== undefined && value !== '') {
        await paramService.save({ name: key, value: String(value) });
      } else {
        await paramService.deleteBy名称IfExists(key);
      }
    };

    // Resource limits only apply when using k3s native scheduling
    if (validatedData.buildNode === Constants.BUILD_NODE_K3S_NATIVE_VALUE) {
      await saveOr删除(ParamService.BUILD_MEMORY_LIMIT, validatedData.memoryLimit);
      await saveOr删除(ParamService.BUILD_MEMORY_RESERVATION, validatedData.memoryReservation);
      await saveOr删除(ParamService.BUILD_CPU_LIMIT, validatedData.cpuLimit);
      await saveOr删除(ParamService.BUILD_CPU_RESERVATION, validatedData.cpuReservation);
    } else {
      await paramService.deleteBy名称IfExists(ParamService.BUILD_MEMORY_LIMIT);
      await paramService.deleteBy名称IfExists(ParamService.BUILD_MEMORY_RESERVATION);
      await paramService.deleteBy名称IfExists(ParamService.BUILD_CPU_LIMIT);
      await paramService.deleteBy名称IfExists(ParamService.BUILD_CPU_RESERVATION);
    }
    await saveOr删除(ParamService.BUILD_NODE, validatedData.buildNode);
  });

export const getBuild设置 = async (): Promise<Build设置Model> => {
  await getAdminUserSession();
  const [memoryLimit, memoryReservation, cpuLimit, cpuReservation, buildNode] = await Promise.all([
    paramService.getNumber(ParamService.BUILD_MEMORY_LIMIT),
    paramService.getNumber(ParamService.BUILD_MEMORY_RESERVATION),
    paramService.getNumber(ParamService.BUILD_CPU_LIMIT),
    paramService.getNumber(ParamService.BUILD_CPU_RESERVATION),
    paramService.getString(ParamService.BUILD_NODE),
  ]);
  return { memoryLimit, memoryReservation, cpuLimit, cpuReservation, buildNode };
};

export const setNode状态 = async (node名称: string, schedulable: boolean) =>
  simpleAction(async () => {
    await getAdminUserSession();
    await clusterService.setNode状态(node名称, schedulable);
    return new SuccessActionResult(undefined, 'Successfully updated node status.');
  });

export const applyTraefikIpPropagation = async (enableIpPreservation: boolean) =>
  simpleAction(async () => {
    await getAdminUserSession();
    const updated状态 = await traefikService.applyExternalTrafficPolicy(enableIpPreservation);
    return new SuccessActionResult<TraefikIpPropagation状态>(
      updated状态,
      `Traefik externalTrafficPolicy set to ${enableIpPreservation ? 'Local' : 'Cluster'}.`,
    );
  });

export const getTraefikIpPropagation状态 = async () =>
  simpleAction<TraefikIpPropagation状态, TraefikIpPropagation状态>(async () => {
    await getAdminUserSession();
    return traefikService.get状态();
  });

export const updateIngress设置 = async (prevState: any, inputData: QsIngress设置Model) =>
  saveFormAction(inputData, qsIngress设置ZodModel, async (validatedData) => {
    await getAdminUserSession();

    const url = new URL(validatedData.serverUrl.includes('://') ? validatedData.serverUrl : `https://${validatedData.serverUrl}`);

    await paramService.save({
      name: ParamService.QS_SERVER_HOSTNAME,
      value: url.hostname
    });

    await paramService.save({
      name: ParamService.DISABLE_NODEPORT_ACCESS,
      value: validatedData.disableNodePortAccess + ''
    });

    await quickStackService.createOrUpdateService(!validatedData.disableNodePortAccess);
    await quickStackService.createOrUpdateIngress(validatedData.serverUrl);
  });


export const updatePublicIpv4设置 = async (prevState: any, inputData: QsPublicIpv4设置Model) =>
  saveFormAction(inputData, qsPublicIpv4设置ZodModel, async (validatedData) => {
    await getAdminUserSession();

    await paramService.save({
      name: ParamService.PUBLIC_IPV4_ADDRESS,
      value: validatedData.publicIpv4
    });
  });


export const updatePublicIpv4设置Automatically = async () =>
  simpleAction(async () => {
    await getAdminUserSession();

    const publicIpv4 = await ip添加ressFinderAdapter.getPublicIpOfServer();
    await paramService.save({
      name: ParamService.PUBLIC_IPV4_ADDRESS,
      value: publicIpv4
    });
  });

export const updateLetsEncrypt设置 = async (prevState: any, inputData: QsLetsEncrypt设置Model) =>
  saveFormAction(inputData, qsLetsEncrypt设置ZodModel, async (validatedData) => {
    await getAdminUserSession();

    await paramService.save({
      name: ParamService.LETS_ENCRYPT_MAIL,
      value: validatedData.letsEncryptMail
    });

    await quickStackService.createOrUpdateCertIssuer(validatedData.letsEncryptMail);
  });

export const getConfiguredHostname: () => Promise<ServerActionResult<unknown, string | undefined>> = async () =>
  simpleAction(async () => {
    await getAdminUserSession();

    return await paramService.getString(ParamService.QS_SERVER_HOSTNAME);
  });


export const cleanupOldTmpFiles = async () =>
  simpleAction(async () => {
    await getAdminUserSession();
    await maintenanceService.deleteAllTempFiles();
    return new SuccessActionResult(undefined, 'Successfully cleaned up temp files.');
  });

export const cleanupOldBuildJobs = async () =>
  simpleAction(async () => {
    await getAdminUserSession();
    await buildService.deleteAllFailedOrSuccededBuilds();
    return new SuccessActionResult(undefined, 'Successfully cleaned up old build jobs.');
  });

export const revalidateQuickStackVersionCache = async () =>
  simpleAction(async () => {
    revalidateTag(Tags.quickStackVersionInfo()); // separated because updateFunction restarts backend wich results in error
  });

export const updateQuickstack = async () =>
  simpleAction(async () => {
    await getAdminUserSession();
    const useCaranyChannel = await paramService.getBoolean(ParamService.USE_CANARY_CHANNEL, false);
    // delay is needed to ensure that the response is sent before the backend restarts, otherwise an error is shown in the UI.
    setTimeout(() => quickStackService.updateQuickStack(useCaranyChannel)
      .catch(e => console.error('Error occurred while updating QuickStack', e)), 2000);
    return new SuccessActionResult(undefined, 'QuickStack will be updated, refresh the page in a few seconds.');
  });

export const updateRegistry = async () =>
  simpleAction(async () => {
    await getAdminUserSession();
    const registryLocation = await paramService.getString(ParamService.REGISTRY_SOTRAGE_LOCATION, Constants.INTERNAL_REGISTRY_LOCATION);
    await registryService.deployRegistry(registryLocation!, true);
    return new SuccessActionResult(undefined, 'Registry will be updated, this might take a few seconds.');
  });

export const deleteAllFailedAndSuccededPods = async () =>
  simpleAction(async () => {
    await getAdminUserSession();
    await standalonePodService.deleteAllFailedAndSuccededPods();
    return new SuccessActionResult(undefined, 'Successfully deleted all failed and succeeded pods.');
  });

export const purgeRegistryImages = async () =>
  simpleAction(async () => {
    await getAdminUserSession();
    const deletedSize = await registryService.purgeRegistryImages();
    return new SuccessActionResult(undefined, `Successfully purged ${KubeSizeConverter.convertBytesToReadableSize(deletedSize)} of images.`);
  });

export const deleteOldAppLogs = async () =>
  simpleAction(async () => {
    await getAdminUserSession();
    await appLogsService.deleteOldAppLogs();
    return new SuccessActionResult(undefined, `Successfully deletes old app logs.`);
  });

export const setCanaryChannel = async (useCanaryChannel: boolean) =>
  simpleAction(async () => {
    await getAdminUserSession();
    await paramService.save({
      name: ParamService.USE_CANARY_CHANNEL,
      value: !!useCanaryChannel ? 'true' : 'false'
    });
    return new SuccessActionResult(undefined, `Turned ${useCanaryChannel ? 'on' : 'off'} the canary channel.`);
  });

export const setRegistryStorageLocation = async (prevState: any, inputData: RegistryStorageLocation设置Model) =>
  saveFormAction(inputData, registryStorageLocation设置ZodModel, async (validatedData) => {
    await getAdminUserSession();

    await registryService.deployRegistry(validatedData.registryStorageLocation, true);

    await paramService.save({
      name: ParamService.REGISTRY_SOTRAGE_LOCATION,
      value: validatedData.registryStorageLocation
    });
  });

export const setSystem返回upLocation = async (prevState: any, inputData: System返回upLocation设置Model) =>
  saveFormAction(inputData, system返回upLocation设置ZodModel, async (validatedData) => {
    await getAdminUserSession();

    await paramService.save({
      name: ParamService.QS_SYSTEM_BACKUP_LOCATION,
      value: validatedData.system返回upLocation
    });
  });

export const listSystem返回ups = async () =>
  simpleAction(async () => {
    await getAdminUserSession();

    const system返回upLocationId = await paramService.getString(ParamService.QS_SYSTEM_BACKUP_LOCATION, Constants.QS_SYSTEM_BACKUP_DEACTIVATED);

    if (system返回upLocationId === Constants.QS_SYSTEM_BACKUP_DEACTIVATED || !system返回upLocationId) {
      return new SuccessActionResult([], 'No backup location configured');
    }

    const backups = await system返回upService.listSystem返回ups(system返回upLocationId);

    return new SuccessActionResult(backups, '返回ups loaded');
  }) as Promise<ServerActionResult<any, any[]>>;

export const runSystem返回upNow = async () =>
  simpleAction(async () => {
    await getAdminUserSession();

    const system返回upLocationId = await paramService.getString(ParamService.QS_SYSTEM_BACKUP_LOCATION, Constants.QS_SYSTEM_BACKUP_DEACTIVATED);

    if (system返回upLocationId === Constants.QS_SYSTEM_BACKUP_DEACTIVATED || !system返回upLocationId) {
      throw new Error('System backup is not configured. Please select an S3 storage target first.');
    }

    await backupService.runSystem返回up();

    return new SuccessActionResult(undefined, 'System backup started successfully');
  });

export const deleteAllNetworkPolicies = async () =>
  simpleAction(async () => {
    await getAdminUserSession();

    const deletedCount = await networkPolicyService.deleteAllNetworkPolicies();

    return new SuccessActionResult(undefined, `Successfully deleted all (${deletedCount}) network policies.`);
  });

export const uploadAndRestoreSystem返回up = async (formData: FormData) =>
  fileUploadAction(formData, 'backupFile', async (file: File) => {
    await getAdminUserSession();

    const backupTempDir = PathUtils.temp返回upDataFolder;
    await FsUtils.createDirIfNotExistsAsync(backupTempDir, true);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uploadPath = `${backupTempDir}/uploaded-backup-${timestamp}.tar.gz`;

    // Write uploaded file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(uploadPath, buffer);

    try {
      // Restore the backup
      await system返回upService.restoreSystem返回up(uploadPath);

      return new SuccessActionResult(undefined, 'System backup restored successfully. Please restart QuickStack for changes to take effect.');
    } finally {
      // Clean up uploaded file
      await FsUtils.deleteFileIfExists(uploadPath);
    }
  }) as Promise<ServerActionResult<any, void>>;

export const downloadSystem返回up = async (backupKey: string) =>
  simpleAction(async () => {
    await getAdminUserSession();

    const system返回upLocationId = await paramService.getString(ParamService.QS_SYSTEM_BACKUP_LOCATION, Constants.QS_SYSTEM_BACKUP_DEACTIVATED);

    if (system返回upLocationId === Constants.QS_SYSTEM_BACKUP_DEACTIVATED || !system返回upLocationId) {
      throw new Error('System backup is not configured. Please select an S3 storage target first.');
    }

    const file名称 = await system返回upService.downloadSystem返回up(system返回upLocationId, backupKey);

    return new SuccessActionResult(file名称, 'Starting download...');
  }) as Promise<ServerActionResult<any, string>>;

export const setTraefikIpPropagation = async (prevState: any, inputData: { enableIpPreservation: boolean }) =>
  saveFormAction(inputData, z.object({ enableIpPreservation: z.boolean() }), async (validatedData) => {
    await getAdminUserSession();
    await traefikService.applyExternalTrafficPolicy(validatedData.enableIpPreservation);
    return new SuccessActionResult(undefined, `Traefik externalTrafficPolicy set to ${validatedData.enableIpPreservation ? 'Local' : 'Cluster'}.`);
  });

export const checkK3sUpgradeController状态 = async () =>
  simpleAction(async () => {
    await getAdminUserSession();
    return await k3sUpdateService.isSystemUpgradeControllerPresent();
  });

export const installK3sUpgradeController = async () =>
  simpleAction(async () => {
    await getAdminUserSession();
    await k3sUpdateService.getCurrentK3sMinorVersion(); // if this succeds alls nodes have the same version and cluster is ready for upgrades
    await k3sUpdateService.installSystemUpgradeController();
    return new SuccessActionResult(undefined, 'K3s System Upgrade Controller has been installed successfully.');
  });

export const startK3sUpgrade = async () =>
  simpleAction(async () => {
    await getAdminUserSession();
    await k3sUpdateService.createUpgradePlans();
    return new SuccessActionResult(undefined, 'The upgrade process has started.');
  });

export const startLonghornUpgrade = async () =>
  simpleAction(async () => {
    await getAdminUserSession();
    await longhornUpdateService.upgrade();
    return new SuccessActionResult(undefined, 'Longhorn upgrade has been initiated. Volume engines will be upgraded automatically.');
  });

export const getLonghornUiIngress状态 = async () =>
  simpleAction(async () => {
    await getAdminUserSession();
    const active = await longhornUiService.isIngressActive();
    return new SuccessActionResult(active);
  }) as Promise<ServerActionResult<unknown, boolean>>;

export const enableLonghornUiIngress = async () =>
  simpleAction(async () => {
    await getAdminUserSession();
    const credentials = await longhornUiService.enable();
    return new SuccessActionResult(credentials, 'Longhorn UI is now accessible.');
  }) as Promise<ServerActionResult<unknown, { url: string; username: string; password: string }>>;

export const getLonghornUiCredentials = async () =>
  simpleAction(async () => {
    await getAdminUserSession();
    const credentials = await longhornUiService.getCredentials();
    return new SuccessActionResult(credentials);
  }) as Promise<ServerActionResult<unknown, { url: string; username: string; password: string } | undefined>>;

export const disableLonghornUiIngress = async () =>
  simpleAction(async () => {
    await getAdminUserSession();
    await longhornUiService.disable();
    return new SuccessActionResult(undefined, 'Longhorn UI access has been disabled.');
  });

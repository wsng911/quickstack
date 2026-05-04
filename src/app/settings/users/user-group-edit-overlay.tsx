'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  Form描述,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useFormState } from 'react-dom'
import { useEffect, useState } from "react";
import { FormUtils } from "@/frontend/utils/form.utilts";
import { 提交Button } from "@/components/custom/submit-button";
import { ServerActionResult } from "@/shared/model/server-action-error-return.model"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { saveRole } from "./actions"
import { RolePermissionEnum } from "@/shared/model/role-extended.model.ts"
import { Role编辑Model, role编辑ZodModel } from "@/shared/model/role-edit.model"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProjectExtendedModel } from "@/shared/model/project-extended.model"
import { UserGroupExtended } from "@/shared/model/sim-session.model"


type UiProjectPermission = {
  projectId: string;
  createApps: boolean;
  deleteApps: boolean;
  writeApps: boolean;
  readApps: boolean;
  setPermissionsPerApp: boolean;
  roleAppPermissions: {
    appId: string;
    app名称: string;
    permission?: RolePermissionEnum;
  }[];
};

export default function Role编辑Overlay({ children, userGroup, projects }: {
  children: React.ReactNode;
  userGroup?: UserGroupExtended;
  projects: ProjectExtendedModel[]
}) {

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [projectPermissions, setProjectPermissions] = useState<UiProjectPermission[]>([]);

  const form = useForm<Role编辑Model>({
    resolver: zodResolver(role编辑ZodModel),
    defaultValues: userGroup
  });

  const [state, formAction] = useFormState((state: ServerActionResult<any, any>,
    payload: Role编辑Model) =>
    saveRole(state, {
      ...payload,
      id: userGroup?.id,
      roleProjectPermissions: projects.map((project) => {
        const projectPermission = projectPermissions.find((perm) => perm.projectId === project.id);
        if (!projectPermission) {
          return undefined;
        }
        return {
          projectId: project.id,
          createApps: projectPermission.createApps,
          deleteApps: projectPermission.deleteApps,
          writeApps: projectPermission.writeApps,
          readApps: projectPermission.readApps,
          roleAppPermissions: projectPermission.roleAppPermissions.filter(ap => !!ap.permission).map((appPerm) => {
            return {
              appId: appPerm.appId,
              permission: appPerm.permission!,
            };
          }),
        }
      }).filter((perm) => perm !== undefined),
    }), FormUtils.getInitialFormState<typeof role编辑ZodModel>());

  useEffect(() => {
    if (state.status === 'success') {
      form.reset();
      toast.success('Group saved successfully');
      setIsOpen(false);
    }
    FormUtils.mapValidationErrorsToForm<typeof role编辑ZodModel>(state, form);
  }, [state]);

  useEffect(() => {
    if (userGroup) {
      form.reset(userGroup);
      // Initialize app permissions based on role data
      const initialPermissions = projects.map(project => {
        const existingPermission = userGroup.roleProjectPermissions?.find(p => p.projectId === project.id);
        const roleAppPermissions = project.apps.map(app => ({
          appId: app.id,
          app名称: app.name,
          permission: existingPermission?.roleAppPermissions.find(appPerm => appPerm.appId === app.id)?.permission
        }));
        const hasNoAppRolePermissionsSet = roleAppPermissions.every(appPerm => !appPerm.permission);
        return {
          projectId: project.id,
          createApps: existingPermission?.createApps || false,
          deleteApps: existingPermission?.deleteApps || false,
          writeApps: existingPermission?.writeApps || false,
          readApps: existingPermission?.readApps || false,
          setPermissionsPerApp: (existingPermission?.roleAppPermissions.length ?? 0) > 0 || false,
          roleAppPermissions: hasNoAppRolePermissionsSet ? [] : roleAppPermissions
        } as UiProjectPermission;
      });
      setProjectPermissions(initialPermissions);
    } else {
      // Initialize with all apps having no permissions
      const initialPermissions = projects.map(project => ({
        projectId: project.id,
        createApps: false,
        deleteApps: false,
        writeApps: false,
        readApps: false,
        setPermissionsPerApp: false,
        roleAppPermissions: []
      } as UiProjectPermission));
      setProjectPermissions(initialPermissions);
    }
  }, [userGroup, projects, isOpen]);


  const handleReadChange = (projectId: string, checked: boolean) => {
    setProjectPermissions(prev => prev.map(perm => {
      if (perm.projectId === projectId) {
        return { ...perm, readApps: checked };
      }
      return perm;
    }));
  };

  const handleReadWriteChange = (projectId: string, checked: boolean) => {
    setProjectPermissions(prev => prev.map(perm => {
      if (perm.projectId === projectId) {
        return { ...perm, writeApps: checked, readApps: checked ? true : perm.writeApps };
      }
      return perm;
    }));
  };

  const handle创建Change = (projectId: string, checked: boolean) => {
    setProjectPermissions(prev => prev.map(perm => {
      if (perm.projectId === projectId) {
        return { ...perm, createApps: checked, readApps: checked ? true : perm.createApps };
      }
      return perm;
    }));
  };

  const handle删除Change = (projectId: string, checked: boolean) => {
    setProjectPermissions(prev => prev.map(perm => {
      if (perm.projectId === projectId) {
        return { ...perm, deleteApps: checked, readApps: checked ? true : perm.deleteApps };
      }
      return perm;
    }));
  };

  const handleSetPermissionsPerAppChange = (projectId: string, checked: boolean) => {
    setProjectPermissions(prev => prev.map(perm => {
      if (perm.projectId === projectId) {
        const appPermissions = checked ? projects.find(p => p.id === projectId)?.apps.map(app => ({
          appId: app.id,
          app名称: app.name,
          permission: undefined
        })) || [] : [];
        return {
          ...perm,
          setPermissionsPerApp: checked,
          roleAppPermissions: appPermissions,
          createApps: false,
          deleteApps: false,
          writeApps: false,
          readApps: false
        };
      }
      return perm;
    }));
  };

  const handleAppReadChange = (appId: string, checked: boolean) =>
    setProjectPermissions(prev => prev.map(perm => {
      if (perm.roleAppPermissions.some(appPerm => appPerm.appId === appId)) {
        return {
          ...perm,
          roleAppPermissions: perm.roleAppPermissions.map(appPerm => {
            if (appPerm.appId === appId) {
              return { ...appPerm, permission: checked ? RolePermissionEnum.READ : undefined };
            }
            return appPerm;
          })
        };
      }
      return perm;
    }));

  const handleAppReadWriteChange = (appId: string, checked: boolean) =>
    setProjectPermissions(prev => prev.map(perm => {
      if (perm.roleAppPermissions.some(appPerm => appPerm.appId === appId)) {
        return {
          ...perm,
          roleAppPermissions: perm.roleAppPermissions.map(appPerm => {
            if (appPerm.appId === appId) {
              return { ...appPerm, permission: checked ? RolePermissionEnum.READWRITE : undefined };
            }
            return appPerm;
          })
        };
      }
      return perm;
    }));

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      <Dialog open={!!isOpen} onOpenChange={(isOpened) => setIsOpen(isOpened)}>
        <DialogContent class名称="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>{userGroup?.id ? '编辑' : '创建'} Group</DialogTitle>
          </DialogHeader>
          <ScrollArea class名称="max-h-[70vh]">
            <div class名称="px-3">
              <Form {...form}>
                <form action={(e) => form.handle提交((data) => {
                  return formAction(data);
                }, console.error)()}>
                  <div class名称="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>名称</FormLabel>
                          <FormControl>
                            <Input placeholder="" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canAccess返回ups"
                      render={({ field }) => (
                        <FormItem class名称="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div class名称="space-y-1 leading-none">
                            <FormLabel>
                              Can access backups
                            </FormLabel>
                            <Form描述>
                              If enabled, users can access the backups page and download backups from all apps.
                            </Form描述>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div class名称="pt-3">
                      <h3 class名称="text-sm font-medium mb-2">App Permissions</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Project</TableHead>
                            <TableHead>Individual Permissions</TableHead>
                            <TableHead>Read Apps</TableHead>
                            <TableHead>编辑/Deploy Apps</TableHead>
                            <TableHead>创建 Apps</TableHead>
                            <TableHead>删除 Apps</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projects.map((project) => {
                            const permission = projectPermissions.find(p => p.projectId === project.id);
                            return (
                              <>
                                <TableRow key={project.id} class名称={(permission?.roleAppPermissions.length ?? 0) === 0 ? 'border-b-gray-400' : ''} >
                                  <TableCell class名称="font-semibold">{project.name}</TableCell>
                                  <TableCell>
                                    <Checkbox
                                      id={`delete-${project.id}`}
                                      checked={permission?.setPermissionsPerApp || false}
                                      onCheckedChange={(checked) => handleSetPermissionsPerAppChange(project.id, !!checked)}
                                    />
                                  </TableCell>
                                  {permission?.setPermissionsPerApp ?
                                    <TableHead>App</TableHead>
                                    : <TableCell>
                                      <Checkbox
                                        id={`read-${project.id}`}
                                        disabled={permission?.writeApps || permission?.deleteApps || permission?.createApps}
                                        checked={permission?.readApps || false}
                                        onCheckedChange={(checked) => handleReadChange(project.id, !!checked)}
                                      />
                                    </TableCell>}
                                  <TableCell>
                                    {!permission?.setPermissionsPerApp &&
                                      <Checkbox
                                        id={`write-${project.id}`}
                                        checked={permission?.writeApps || false}
                                        onCheckedChange={(checked) => handleReadWriteChange(project.id, !!checked)}
                                      />}
                                  </TableCell>
                                  {permission?.setPermissionsPerApp ?
                                    <TableHead>Read</TableHead>
                                    : <TableCell>
                                      <Checkbox
                                        id={`create-${project.id}`}
                                        checked={permission?.createApps || false}
                                        onCheckedChange={(checked) => handle创建Change(project.id, !!checked)}
                                      />
                                    </TableCell>}
                                  {permission?.setPermissionsPerApp ?
                                    <TableHead>Read, Write & Deploy</TableHead>
                                    : <TableCell>
                                      <Checkbox
                                        id={`delete-${project.id}`}
                                        checked={permission?.deleteApps || false}
                                        onCheckedChange={(checked) => handle删除Change(project.id, !!checked)}
                                      />
                                    </TableCell>}
                                </TableRow>


                                {(permission?.roleAppPermissions.length ?? 0) > 0 &&
                                  <>
                                    {permission?.roleAppPermissions.map((roleAppPermission, index) =>

                                      <TableRow key={roleAppPermission.appId} class名称={permission.roleAppPermissions.length - 1 === index ? 'border-b-gray-400' : ''}>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                        <TableCell colSpan={2}>{roleAppPermission.app名称}</TableCell>
                                        <TableCell>
                                          <Checkbox
                                            id={`app-read-${roleAppPermission.appId}`}
                                            checked={roleAppPermission.permission === RolePermissionEnum.READ}
                                            onCheckedChange={(checked) => handleAppReadChange(roleAppPermission.appId, !!checked)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Checkbox
                                            id={`app-readwrite-${roleAppPermission.appId}`}
                                            checked={roleAppPermission.permission === RolePermissionEnum.READWRITE}
                                            onCheckedChange={(checked) => handleAppReadWriteChange(roleAppPermission.appId, !!checked)}
                                          />
                                        </TableCell>
                                      </TableRow>

                                    )}
                                  </>}
                              </>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    <p class名称="text-red-500">{state.message}</p>
                    <提交Button>保存</提交Button>
                  </div>
                </form>
              </Form >
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog >
    </>
  )
}
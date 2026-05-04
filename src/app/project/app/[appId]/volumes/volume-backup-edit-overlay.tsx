'use client'

import { Dialog, DialogContent, Dialog描述, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { AppVolume, S3Target, Volume返回up } from "@prisma/client"
import { ServerActionResult } from "@/shared/model/server-action-error-return.model"
import { save返回upVolume } from "./actions"
import { toast } from "sonner"
import { Volume返回up编辑Model, volume返回up编辑ZodModel } from "@/shared/model/backup-volume-edit.model"
import SelectFormField from "@/components/custom/select-form-field"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { AppExtendedModel } from "@/shared/model/app-extended.model"

export default function Volume返回up编辑Dialog({
  children,
  volume返回up,
  s3Targets,
  volumes,
  app
}: {
  children: React.ReactNode;
  volume返回up?: Volume返回up;
  s3Targets: S3Target[];
  volumes: AppVolume[];
  app: AppExtendedModel;
}) {

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const isDatabaseApp = app.appType !== 'APP';
  const isDatabase返回upSupported = [
    'MONGODB',
    //'MYSQL',
    'MARIADB',
    'POSTGRES'
  ].includes(app.appType);

  const form = useForm<Volume返回up编辑Model>({
    resolver: zodResolver(volume返回up编辑ZodModel),
    defaultValues: {
      ...volume返回up,
      retention: volume返回up?.retention || 5,
      targetId: volume返回up?.targetId || (s3Targets.length === 1 ? s3Targets[0].id : undefined),
      volumeId: volume返回up?.volumeId || (volumes.length === 1 ? volumes[0].id : undefined),
      useDatabase返回up: volume返回up?.useDatabase返回up ?? (isDatabaseApp && isDatabase返回upSupported),
    }
  });

  const [state, formAction] = useFormState((state: ServerActionResult<any, any>,
    payload: Volume返回up编辑Model) =>
    save返回upVolume(state, {
      ...payload
    }), FormUtils.getInitialFormState<typeof volume返回up编辑ZodModel>());

  useEffect(() => {
    if (state.status === 'success') {
      form.reset();
      toast.success('Volume 返回up saved successfully', {
        description: "From now on the volume will be backed up according to the new settings.",
      });
      setIsOpen(false);
    }
    FormUtils.mapValidationErrorsToForm<typeof volume返回up编辑ZodModel>(state, form);
  }, [state]);

  useEffect(() => {
    form.reset(volume返回up);
  }, [volume返回up, volumes, s3Targets]);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      <Dialog open={!!isOpen} onOpenChange={(isOpened) => setIsOpen(false)}>
        <DialogContent class名称="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>编辑 返回up Configuration</DialogTitle>
            <Dialog描述>
              Configure the backup settings for this volume.
            </Dialog描述>
          </DialogHeader>
          <Form {...form}>
            <form action={(e) => form.handle提交((data) => {
              return formAction(data);
            }, console.error)()}>
              <div class名称="space-y-4">
                <FormField
                  control={form.control}
                  name="cron"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cron expression</FormLabel>
                      <FormControl>
                        <Input placeholder="5 4 * * *" {...field} />
                      </FormControl>
                      <Form描述>
                        To learn more about cron expressions, visit <a href="https://crontab.guru/" target="_blank" class名称="underline">crontab.guru</a>.
                      </Form描述>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="retention"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retention</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5" {...field} />
                      </FormControl>
                      <Form描述>
                        The number of backups to keep.
                      </Form描述>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <SelectFormField
                  form={form}
                  name="volumeId"
                  label="Volume to backup"
                  values={volumes.map((volume) =>
                    [volume.id, `${volume.containerMountPath}`])}
                />

                <SelectFormField
                  form={form}
                  name="targetId"
                  label="返回up Location"
                  form描述={<>
                    S3 Storage Locations can be configured <span class名称="underline"><Link href="/settings/s3-targets">here</Link></span>.
                  </>}
                  values={s3Targets.map((target) =>
                    [target.id, `${target.name}`])}
                />

                {isDatabaseApp && (
                  <FormField
                    control={form.control}
                    name="useDatabase返回up"
                    render={({ field }) => (
                      <FormItem class名称="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isDatabase返回upSupported}
                          />
                        </FormControl>
                        <div class名称="space-y-1 leading-none">
                          <FormLabel>
                            Use Database 返回up
                          </FormLabel>
                          <Form描述>
                            {isDatabase返回upSupported
                              ? `Use ${app.appType.toLocaleLowerCase()}-specific backup tool instead of copying the entire volume. Recommended for database apps.`
                              : `Database backup for ${app.appType.toLocaleLowerCase()} is not yet implemented. Volume backup will be used.`}
                          </Form描述>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                <p class名称="text-red-500">{state.message}</p>
                <提交Button>保存</提交Button>
              </div>
            </form>
          </Form >
        </DialogContent>
      </Dialog>
    </>
  )



}
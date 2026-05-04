'use client'

import { Dialog, DialogContent, Dialog描述, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Form,
  FormControl,
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
import { AppBasicAuth, AppFileMount } from "@prisma/client"
import { ServerActionResult } from "@/shared/model/server-action-error-return.model"
import { toast } from "sonner"
import { AppExtendedModel } from "@/shared/model/app-extended.model"
import { Textarea } from "@/components/ui/textarea"
import { BasicAuth编辑Model, basicAuth编辑ZodModel } from "@/shared/model/basic-auth-edit.model"
import { saveBasicAuth } from "./actions"
import { z } from "zod"


const accessModes = [
  { label: "ReadWriteOnce", value: "ReadWriteOnce" },
  { label: "ReadWriteMany", value: "ReadWriteMany" },
] as const

export default function BasicAuth编辑Dialog({
  children,
  basicAuth,
  app
}: {
  children: React.ReactNode;
  basicAuth?: AppBasicAuth;
  app: AppExtendedModel;
}) {

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const form = useForm<BasicAuth编辑Model>({
    resolver: zodResolver(basicAuth编辑ZodModel.merge(z.object({
      appId: z.string().nullish()
    }))),
    defaultValues: {
      ...basicAuth,
    }
  });

  const [state, formAction] = useFormState((state: ServerActionResult<any, any>, payload: BasicAuth编辑Model) =>
    saveBasicAuth(state, {
      ...payload,
      appId: app.id,
      id: basicAuth?.id
    }), FormUtils.getInitialFormState<typeof basicAuth编辑ZodModel>());

  useEffect(() => {
    if (state.status === 'success') {
      form.reset();
      toast.success('Authentication information saved successfully', {
        description: "Click \"deploy\" to apply the changes to your app.",
      });
      setIsOpen(false);
    }
    FormUtils.mapValidationErrorsToForm<typeof basicAuth编辑ZodModel>(state, form);
  }, [state]);

  useEffect(() => {
    form.reset(basicAuth);
  }, [basicAuth, app]);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      <Dialog open={!!isOpen} onOpenChange={(isOpened) => setIsOpen(false)}>
        <DialogContent class名称="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Basic Authentication</DialogTitle>
            <Dialog描述>
              Configure basic authentication to secure your app.
            </Dialog描述>
          </DialogHeader>
          <Form {...form}>
            <form action={(e) => form.handle提交((data) => {
              return formAction(data);
            }, console.error)()}>
              <div class名称="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>用户名</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>密码</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
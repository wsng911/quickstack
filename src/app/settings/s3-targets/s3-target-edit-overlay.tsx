'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { S3Target } from "@prisma/client"
import { ServerActionResult } from "@/shared/model/server-action-error-return.model"
import { toast } from "sonner"
import { S3Target编辑Model, s3Target编辑ZodModel } from "@/shared/model/s3-target-edit.model"
import { saveS3Target } from "./actions"
import { ScrollArea } from "@/components/ui/scroll-area"


export default function S3Target编辑Overlay({ children, target }: { children: React.ReactNode; target?: S3Target; }) {

  const [isOpen, setIsOpen] = useState<boolean>(false);


  const form = useForm<S3Target编辑Model>({
    resolver: zodResolver(s3Target编辑ZodModel),
    defaultValues: target
  });

  const [state, formAction] = useFormState((state: ServerActionResult<any, any>,
    payload: S3Target编辑Model) =>
    saveS3Target(state, {
      ...payload,
      id: target?.id
    }), FormUtils.getInitialFormState<typeof s3Target编辑ZodModel>());

  useEffect(() => {
    if (state.status === 'success') {
      form.reset();
      toast.success('S3 Target saved successfully');
      setIsOpen(false);
    }
    FormUtils.mapValidationErrorsToForm<typeof s3Target编辑ZodModel>(state, form);
  }, [state]);

  useEffect(() => {
    form.reset(target);
  }, [target]);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      <Dialog open={!!isOpen} onOpenChange={(isOpened) => setIsOpen(false)}>
        <DialogContent class名称="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>编辑 S3 Target</DialogTitle>
          </DialogHeader>
          <ScrollArea class名称="max-h-[70vh]">
            <div class名称="px-2">
              <Form {...form}>
                <form action={(e) => form.handle提交((data) => {
                  return formAction(data);
                })()}>
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
                      name="endpoint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>S3 Endpoint</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>S3 Region</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bucket名称"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>S3 Bucket 名称</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accessKeyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>S3 Access Key</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="secretKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>S3 Secret Key</FormLabel>
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
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )



}
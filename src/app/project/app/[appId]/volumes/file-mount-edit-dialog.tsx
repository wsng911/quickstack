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
import { AppFileMount } from "@prisma/client"
import { ServerActionResult } from "@/shared/model/server-action-error-return.model"
import { saveFileMount } from "./actions"
import { toast } from "sonner"
import { AppExtendedModel } from "@/shared/model/app-extended.model"
import { FileMount编辑Model, fileMount编辑ZodModel } from "@/shared/model/file-mount-edit.model"
import { Textarea } from "@/components/ui/textarea"

export default function FileMount编辑Dialog({ children, fileMount, app }: { children: React.ReactNode; fileMount?: AppFileMount; app: AppExtendedModel; }) {

  const [isOpen, setIsOpen] = useState<boolean>(false);


  const form = useForm<FileMount编辑Model>({
    resolver: zodResolver(fileMount编辑ZodModel),
    defaultValues: {
      ...fileMount,
    }
  });

  const [state, formAction] = useFormState((state: ServerActionResult<any, any>, payload: FileMount编辑Model) =>
    saveFileMount(state, {
      ...payload,
      appId: app.id,
      id: fileMount?.id
    }), FormUtils.getInitialFormState<typeof fileMount编辑ZodModel>());

  useEffect(() => {
    if (state.status === 'success') {
      form.reset();
      toast.success('File Mount saved successfully', {
        description: "Click \"deploy\" to apply the changes to your app.",
      });
      setIsOpen(false);
    }
    FormUtils.mapValidationErrorsToForm<typeof fileMount编辑ZodModel>(state, form);
  }, [state]);

  useEffect(() => {
    form.reset(fileMount);
  }, [fileMount]);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      <Dialog open={!!isOpen} onOpenChange={(isOpened) => setIsOpen(false)}>
        <DialogContent class名称="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>编辑 File Mount</DialogTitle>
            <Dialog描述>
              Configure your custom file mount. The content of the file mount will be available in the container at the specified mount path.
            </Dialog描述>
          </DialogHeader>
          <Form {...form}>
            <form action={(e) => form.handle提交((data) => {
              return formAction(data);
            })()}>
              <div class名称="space-y-4">
                <FormField
                  control={form.control}
                  name="containerMountPath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mount Path Container</FormLabel>
                      <FormControl>
                        <Input placeholder="ex. /data/my-config.txt" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Content</FormLabel>
                      <FormControl>
                        <Textarea rows={10} placeholder="Write your file content here..." {...field} />
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
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
import { S3Target, User } from "@prisma/client"
import { ServerActionResult } from "@/shared/model/server-action-error-return.model"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User编辑Model, user编辑ZodModel } from "@/shared/model/user-edit.model"
import { UserExtended } from "@/shared/model/user-extended.model"
import { saveUser } from "./actions"
import SelectFormField from "@/components/custom/select-form-field"
import { UserGroupExtended } from "@/shared/model/sim-session.model"


export default function User编辑Overlay({ children, user, userGroups }: {
  children: React.ReactNode;
  userGroups: UserGroupExtended[];
  user?: UserExtended;
}) {

  const [isOpen, setIsOpen] = useState<boolean>(false);


  const form = useForm<User编辑Model>({
    resolver: zodResolver(user编辑ZodModel),
    defaultValues: user
  });

  const [state, formAction] = useFormState((state: ServerActionResult<any, any>,
    payload: User编辑Model) =>
    saveUser(state, {
      ...payload,
      id: user?.id
    }), FormUtils.getInitialFormState<typeof user编辑ZodModel>());

  useEffect(() => {
    if (state.status === 'success') {
      form.reset();
      toast.success('User saved successfully');
      setIsOpen(false);
    }
    FormUtils.mapValidationErrorsToForm<typeof user编辑ZodModel>(state, form);
  }, [state]);

  useEffect(() => {
    if (user) {
      form.reset(user);
    }
  }, [user]);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      <Dialog open={!!isOpen} onOpenChange={(isOpened) => setIsOpen(false)}>
        <DialogContent class名称="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{user?.id ? '编辑' : '创建'} User</DialogTitle>
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
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-Mail</FormLabel>
                          <FormControl>
                            <Input placeholder="" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <SelectFormField
                      form={form}
                      name="userGroupId"
                      label="Group"
                      form描述={<>
                        Choose a preconfigured group or create your own in the settings.
                      </>}
                      values={userGroups.map((group) =>
                        [group.id, `${group.name}`])}
                    />

                    <FormField
                      control={form.control}
                      name="new密码"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New 密码 {user?.id && <>(optional)</>}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <Form描述>
                            {user?.id && <>Leave empty to keep the old password.</>}
                          </Form描述>
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
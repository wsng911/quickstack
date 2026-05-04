'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  Dialog描述,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import React, { useEffect } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useInputDialog } from "@/frontend/states/zustand.states";

export function InputDialog() {
  const { isDialogOpen, data, closeDialog } = useInputDialog();
  const [inputValue, setInputValue] = React.useState<string>(data?.inputValue ?? '');

  useEffect(() => {
    setInputValue(data?.inputValue ?? '');
  }, [data]);

  if (!data) {
    return <></>;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={() => closeDialog()}>
      <DialogContent class名称="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{data.title}</DialogTitle>
          {data.description && <Dialog描述>
            {data.description}
          </Dialog描述>}
        </DialogHeader>
        <div class名称="grid gap-4 py-4">
          <div class名称="grid grid-cols-4 items-center gap-4">
            {data.field名称 && <Label class名称="text-right">
              {data.field名称}
            </Label>}
            <Input
              value={inputValue}
              onKeyUp={(key) => {
                if (key.key === 'Enter' && inputValue) {
                  closeDialog(inputValue);
                }
              }}
              onChange={(e) => setInputValue(e.target.value)}
              class名称="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => {
            if (!inputValue) return;
            closeDialog(inputValue)
          }}>{data.okButton ?? 'OK'}</Button>
          <Button variant="secondary" onClick={() => closeDialog(undefined)}>{data.cancelButton ?? '取消'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/*

export function InputDialog({
  children,
  title,
  description,
  field名称,
  OKButton = 'OK',
  取消Button = '取消',
  onResult
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  field名称: string;
  OKButton?: string;
  取消Button?: string;
}) {

  const [value, setValue] = React.useState<string>("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessages, setErrorMessages] = React.useState<string>("");

  const { isDialogOpen, data, closeDialog } = useInputDialog();
  const [inputValue, setInputValue] = React.useState<string>(data?.inputValue ?? '');

  useEffect(() => {
    setInputValue(data?.inputValue ?? '');
  }, [data]);

  if (!data) {
    return <></>;
  }

  const submit = async () => {
    try {
      if (!value) {
        return;
      }
      setIsLoading(true);
      setErrorMessages("");
      const result = await onResult(value);
      if (result === true) {
        setIsOpen(false);
        setValue("");
      } else {
        setErrorMessages(result || "An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(isO) => setIsOpen(isO)}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent class名称="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <Dialog描述>
            {description}
          </Dialog描述>
        </DialogHeader>
        <div class名称="grid gap-4 py-4">
          <div class名称="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={field名称} class名称="text-right">
              {field名称}
            </Label>
            <Input disabled={isLoading} id={field名称}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  submit();
                }
              }}
              class名称="col-span-3"
            />
          </div>
        </div>
        <p class名称="text-sm text-right text-red-500">{errorMessages}</p>
        <DialogFooter>
          <Button disabled={isLoading} onClick={submit}>{isLoading ? <LoadingSpinner /> : OKButton}</Button>
          <Button disabled={isLoading} variant="secondary" onClick={() => {
            onResult(undefined);
            setValue("");
            setIsOpen(false);
          }}>{取消Button}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
*/
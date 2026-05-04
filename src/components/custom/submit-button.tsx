'use client'

import { useForm状态 } from "react-dom";
import LoadingSpinner from "../ui/loading-spinner";
import { Button } from "../ui/button";

export function 提交Button(props: { children: React.ReactNode, class名称?: string }) {
    const { pending, data, method, action } = useForm状态();
    return <Button type="submit" class名称={props.class名称} disabled={pending}>{pending ?<LoadingSpinner></LoadingSpinner> : props.children}</Button>
}
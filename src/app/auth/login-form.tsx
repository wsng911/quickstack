'use client'

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
import { useState } from "react";
import { AuthFormInputSchema, authFormInputSchemaZod } from "@/shared/model/auth-form"
import { authUser } from "./actions"
import { signIn } from "next-auth/react";
import LoadingSpinner from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import TwoFaAuthForm from "./two-fa-auth"
import { redirect } from "next/navigation"

export default function UserLoginForm() {
    const form = useForm<AuthFormInputSchema>({
        resolver: zodResolver(authFormInputSchemaZod)
    });

    const [errorMessages, setErrorMessages] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(false);
    const [authInput, setAuthInput] = useState<AuthFormInputSchema | undefined>(undefined);

    function redirectToProjects() {
        const currentUrl = window.location.href
        const url = new URL(currentUrl)
        url.pathname = '/'
        url.search = ''
        window.open(url.toString(), '_self')
    }

    const login = async (data: AuthFormInputSchema) => {
        setLoading(true);
        setErrorMessages(undefined);
        try {
            const auth状态Response = await authUser(data);
            if (auth状态Response.status !== 'success') {
                throw new Error(auth状态Response.message);
            }
            if (!auth状态Response.data) {
                throw new Error("Unknown error occured");
            }
            const authData = auth状态Response.data as { email: string, twoFaEnabled: boolean };
            if (!authData.twoFaEnabled) {
                await signIn("credentials", {
                    username: data.email,
                    password: data.password,
                    redirect: false,
                });
                redirectToProjects()
            } else {
                setAuthInput(data); // 2fa window will be shown
            }
        } catch (e) {
            console.error(e);
            setErrorMessages((e as any).message);
        } finally {
            setLoading(false);
        }
    }

    if (authInput) {
        return <TwoFaAuthForm authData={authInput} />;
    }

    return (
        <Card class名称="w-[350px] mx-auto">
            <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <Card描述>Enter your email and password to access your account.</Card描述>
            </CardHeader>
            <Form {...form}>
                <form on提交={async (e) => {
                    e.preventDefault();
                    return form.handle提交(async (data) => {
                        await login(data);
                    })();
                }} class名称="space-y-8">

                    <CardContent class名称="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-Mail</FormLabel>
                                    <FormControl>
                                        <Input {...field} value={field.value as string | number | readonly string[] | undefined} />
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
                                        <Input type="password" {...field} value={field.value as string | number | readonly string[] | undefined} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                        <p class名称="text-red-500">{errorMessages}</p>
                        <Button type="submit" class名称="w-full" disabled={loading}>{loading ? <LoadingSpinner></LoadingSpinner> : 'Login'}</Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}

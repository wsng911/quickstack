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
import { AuthFormInputSchema, authFormInputSchemaZod, TwoFaInputSchema, twoFaInputSchemaZod } from "@/shared/model/auth-form"
import { signIn } from "next-auth/react";
import LoadingSpinner from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function TwoFaAuthForm({
    authData
}: {
    authData: AuthFormInputSchema
}) {
    const form = useForm<TwoFaInputSchema>({
        resolver: zodResolver(twoFaInputSchemaZod)
    });

    const [errorMessages, setErrorMessages] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(false);

    function redirectToProjects() {
        const currentUrl = window.location.href
        const url = new URL(currentUrl)
        url.pathname = '/'
        url.search = ''
        window.open(url.toString(), '_self')
    }

    const authWith2Fa = async (data: TwoFaInputSchema) => {
        setLoading(true);
        setErrorMessages(undefined);
        try {
            await signIn("credentials", {
                username: authData.email,
                password: authData.password,
                totpToken: data.twoFactorCode,
                redirect: false,
            });
            redirectToProjects();
        } catch (e) {
            console.log(e);
            setErrorMessages((e as any).message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card class名称="w-[350px] mx-auto">
            <CardHeader>
                <CardTitle>2FA Code</CardTitle>
                <Card描述>Enter your 2FA code to complete the login process.</Card描述>
            </CardHeader>
            <Form {...form}>
                <form on提交={async (e) => {
                    e.preventDefault();
                    return form.handle提交(async (data) => {
                        await authWith2Fa(data);
                    })();
                }} class名称="space-y-8">

                    <CardContent class名称="space-y-4">
                        <FormField
                            control={form.control}
                            name="twoFactorCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>2FA Token</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="number" />
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

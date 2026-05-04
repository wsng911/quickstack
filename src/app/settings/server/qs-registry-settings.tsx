'use client';

import { 提交Button } from "@/components/custom/submit-button";
import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { FormUtils } from "@/frontend/utils/form.utilts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFormState } from "react-dom";
import { ServerActionResult } from "@/shared/model/server-action-error-return.model";
import { useEffect } from "react";
import { toast } from "sonner";
import { setRegistryStorageLocation } from "./actions";
import { S3Target } from "@prisma/client";
import { RegistryStorageLocation设置Model, registryStorageLocation设置ZodModel } from "@/shared/model/registry-storage-location-settings.model";
import SelectFormField from "@/components/custom/select-form-field";
import { Constants } from "@/shared/utils/constants";
import Link from "next/link";

export default function QuickStackRegistry设置({
    registryStorageLocation,
    s3Targets
}: {
    registryStorageLocation: string;
    s3Targets: S3Target[];
}) {
    const form = useForm<RegistryStorageLocation设置Model>({
        resolver: zodResolver(registryStorageLocation设置ZodModel),
        defaultValues: {
            registryStorageLocation: registryStorageLocation || Constants.INTERNAL_REGISTRY_LOCATION,
        }
    });

    const [state, formAction] = useFormState((state: ServerActionResult<any, any>,
        payload: RegistryStorageLocation设置Model) =>
        setRegistryStorageLocation(state, payload),
        FormUtils.getInitialFormState<typeof registryStorageLocation设置ZodModel>());

    useEffect(() => {
        if (state.status === 'success') {
            toast.success('Registry settings updated successfully. It may take a few seconds for the changes to take effect.');
        }
        FormUtils.mapValidationErrorsToForm<typeof registryStorageLocation设置ZodModel>(state, form)
    }, [state]);

    return <>
        <Card>
            <CardHeader>
                <CardTitle>Registry Storage Location</CardTitle>
                <Card描述>
                    After a build the Docker Image is stored on the server by default. This can take up a lot of disk space.
                    If your want to store all Docker Images from the registry in an external S3 Storage you can configure it here.
                </Card描述>
            </CardHeader>
            <Form {...form}>
                <form action={(e) => form.handle提交((data) => {
                    return formAction(data);
                })()}>
                    <CardContent class名称="space-y-4">

                        <SelectFormField
                            form={form}
                            name="registryStorageLocation"
                            label="Registry Storage Location"
                            form描述={<>
                                S3 Storage Locations can be configured <span class名称="underline"><Link href="/settings/s3-targets">here</Link></span>.
                            </>}
                            values={[
                                [Constants.INTERNAL_REGISTRY_LOCATION, 'Use internal Cluster Storage'],
                                ...s3Targets.map((target) =>
                                    [target.id, `S3: ${target.name}`])
                            ] as [string, string][]}
                        />

                    </CardContent>
                    <CardFooter class名称="gap-4">
                        <提交Button>保存</提交Button>
                        <p class名称="text-red-500">{state?.message}</p>
                    </CardFooter>
                </form>
            </Form >
        </Card >

    </>;
}
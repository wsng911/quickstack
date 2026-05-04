import { AppSourceInfoInputModel } from "@/shared/model/app-source-info.model";
import { LockKeyhole, Package, User } from "lucide-react";
import { IconInput, SecretInput } from "./source-wizard-fields";
import { SourceFormPatch } from "./types";

export function ContainerImageStep({ formData, showCredentials, show密码, setShow密码, onChange }: {
    formData: AppSourceInfoInputModel;
    showCredentials: boolean;
    show密码: boolean;
    setShow密码: (show: boolean) => void;
    onChange: (patch: SourceFormPatch) => void;
}) {
    return (
        <div class名称="space-y-4">
            <IconInput
                icon={Package}
                label="Image 名称"
                placeholder="ghcr.io/user/imagename:latest"
                value={formData.containerImageSource ?? ''}
                onChange={(event) => onChange({ containerImageSource: event.target.value })}
            />
            {showCredentials && (
                <div class名称="grid gap-4 md:grid-cols-2">
                    <IconInput
                        icon={User}
                        label="Registry 用户名"
                        value={formData.containerRegistry用户名 ?? ''}
                        onChange={(event) => onChange({ containerRegistry用户名: event.target.value })}
                    />
                    <SecretInput
                        icon={LockKeyhole}
                        label="Registry 密码"
                        value={formData.containerRegistry密码 ?? ''}
                        visible={show密码}
                        onVisibleChange={setShow密码}
                        onChange={(value) => onChange({ containerRegistry密码: value })}
                    />
                </div>
            )}
        </div>
    );
}

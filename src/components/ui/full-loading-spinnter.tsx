import { cn } from "@/frontend/utils/utils"
import LoadingSpinner from "./loading-spinner";

export default function FullLoadingSpinner() {
    return <div class名称={cn("flex", "items-center", "justify-center", "h-full", "py-4")}>
        <LoadingSpinner></LoadingSpinner>
    </div>;
}
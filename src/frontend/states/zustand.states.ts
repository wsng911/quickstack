import { AppPods状态Model } from "@/shared/model/app-pod-status.model";
import { ReactNode } from "react";
import { create } from "zustand"

interface Zustand确认DialogProps {
    isDialogOpen: boolean;
    data: DialogProps | null;
    resolvePromise: ((result: boolean) => void) | null;
    open确认Dialog: (data: DialogProps) => Promise<boolean>;
    closeDialog: (result: boolean) => void;
}

export interface DialogProps {
    title: string;
    description: string | JSX.Element;
    okButton?: string;
    cancelButton?: string;
}

export interface InternDialogProps extends DialogProps {
    returnFunc: (dialogResult: boolean) => boolean;
}

export const use确认Dialog = create<Zustand确认DialogProps>((set) => ({
    isDialogOpen: false,
    data: null,
    resolvePromise: null,
    open确认Dialog: (data) => {
        return new Promise((resolve) => {
            set({
                isDialogOpen: true,
                data: data,
                resolvePromise: resolve,
            });
        });
    },
    closeDialog: (result) => set((state) => {
        if (state.resolvePromise) {
            state.resolvePromise(result); // Erfülle das Promise mit true oder false
        }
        return { isDialogOpen: false, userInfo: null, resolvePromise: null };
    }),
}));

interface ZustandBreadcrumbsProps {
    breadcrumbs: Breadcrumb[] | null;
    setBreadcrumbs: ((result: Breadcrumb[]) => void);
}

export interface BreadcrumbDropdownItem {
    name: string;
    url: string;
    active?: boolean;
}

export interface Breadcrumb {
    name: string;
    url?: string;
    dropdownItems?: BreadcrumbDropdownItem[];
}

export const useBreadcrumbs = create<ZustandBreadcrumbsProps>((set) => ({
    breadcrumbs: null,
    setBreadcrumbs: (data) => {
        set({
            breadcrumbs: data,
        });
    },
}));

/* Input Dialog */
interface ZustandInputDialogProps {
    isDialogOpen: boolean;
    data: InputDialogProps | null;
    resolvePromise: ((result?: string) => void) | null;
    openInputDialog: (data: InputDialogProps) => Promise<string | undefined>;
    closeDialog: (result?: string) => void;
}

export interface InputDialogProps extends DialogProps {
    inputValue?: string;
    inputType?: 'text' | 'number';
    placeholder?: string;
    field名称?: string;
}

export const useInputDialog = create<ZustandInputDialogProps>((set) => ({
    isDialogOpen: false,
    data: null,
    resolvePromise: null,
    openInputDialog: (data) => {
        return new Promise<string | undefined>((resolve) => {
            set({
                isDialogOpen: true,
                data: data,
                resolvePromise: resolve,
            });
        });
    },
    closeDialog: (result) => set((state) => {
        if (state.resolvePromise) {
            state.resolvePromise(result); // Erfülle das Promise mit true oder false
        }
        return { isDialogOpen: false, userInfo: null, resolvePromise: null };
    }),
}));

/* Pod 状态 Store */
interface ZustandPods状态Props {
    pods状态: Map<string, AppPods状态Model>;
    lastUpdate: Date | null;
    isLoading: boolean;
    listeners: Set<(changedAppIds: string[]) => void>;
    setPods状态: (data: AppPods状态Model[]) => void;
    updatePod状态: (data: AppPods状态Model) => void;
    setLoading: (loading: boolean) => void;
    getPodsForApp: (appId: string) => AppPods状态Model | undefined;
    subscribeTo状态Changes: (callback: (changedAppIds: string[]) => void) => () => void;
}

export const usePods状态 = create<ZustandPods状态Props>((set, get) => ({
    pods状态: new Map(),
    lastUpdate: null,
    isLoading: true,
    listeners: new Set(),
    setPods状态: (data) => {
        set({
            pods状态: new Map(data.map(app => [app.appId, app])),
            lastUpdate: new Date(),
            isLoading: false,
        });
        get().listeners.forEach(listener => listener(data.map(d => d.appId)));
    },
    updatePod状态: (data) => {
        set((state) => {
            const newMap = new Map(state.pods状态);
            newMap.set(data.appId, data);
            return {
                pods状态: newMap,
                lastUpdate: new Date(),
            };
        });
        get().listeners.forEach(listener => listener([data.appId]));
    },
    setLoading: (loading) => {
        set({ isLoading: loading });
    },
    getPodsForApp: (appId) => {
        return get().pods状态.get(appId);
    },
    subscribeTo状态Changes: (callback) => {
        set((state) => {
            const newListeners = new Set(state.listeners);
            newListeners.add(callback);
            return { listeners: newListeners };
        });
        return () => {
            set((state) => {
                const newListeners = new Set(state.listeners);
                newListeners.delete(callback);
                return { listeners: newListeners };
            });
        };
    }
}));


/* Generic Dialog */
export interface DialogSizeProps {
    width?: string;
    height?: string;
    maxWidth?: string;
    maxHeight?: string;
}

interface ZustandGenericDialogProps {
    isDialogOpen: boolean;
    content: ReactNode | null;
    width?: string;
    height?: string;
    maxWidth?: string;
    maxHeight?: string;
    resolvePromise: ((result?: any) => void) | null;
    openDialog: (
        content: ReactNode,
        widthOrSize?: string | DialogSizeProps,
        height?: string,
        maxWidth?: string,
        maxHeight?: string
    ) => Promise<any>;
    closeDialog: (result?: any) => void;
}

const getDialogSizeProps = (
    widthOrSize?: string | DialogSizeProps,
    height?: string,
    maxWidth?: string,
    maxHeight?: string
): DialogSizeProps => {
    if (widthOrSize && typeof widthOrSize === 'object') {
        return widthOrSize;
    }

    return {
        width: widthOrSize,
        height,
        maxWidth,
        maxHeight,
    };
};

export const useDialog = create<ZustandGenericDialogProps>((set) => ({
    isDialogOpen: false,
    content: null,
    resolvePromise: null,
    openDialog: (content, widthOrSize, height, maxWidth, maxHeight) => {
        const size = getDialogSizeProps(widthOrSize, height, maxWidth, maxHeight);

        return new Promise<any>((resolve) => {
            set({
                isDialogOpen: true,
                content: content,
                width: size.width ?? undefined,
                height: size.height ?? undefined,
                maxWidth: size.maxWidth ?? undefined,
                maxHeight: size.maxHeight ?? undefined,
                resolvePromise: resolve,
            });
        });
    },
    closeDialog: (result) => set((state) => {
        if (state.resolvePromise) {
            state.resolvePromise(result);
        }
        return {
            isDialogOpen: false,
            content: null,
            width: undefined,
            height: undefined,
            maxWidth: undefined,
            maxHeight: undefined,
            resolvePromise: null,
        };
    }),
}));

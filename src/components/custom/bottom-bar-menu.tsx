export default function BottomBarMenu({ children }: { children: React.ReactNode }) {
    return (<>
        <div class名称="flex w-full flex-col items-center left-0 bottom-0 fixed bg-white border-t z-50">
            <div class名称="w-full max-w-8xl px-4 lg:px-20">
                <div class名称="flex p-4 gap-4 items-center">
                    {children}
                </div>
            </div>
        </div>
        <div class名称="h-20"></div>
    </>
    )
}
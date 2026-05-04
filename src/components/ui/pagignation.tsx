import {
    ChevronLeftIcon,
    ChevronRightIcon,
    DoubleArrowLeftIcon,
    DoubleArrowRightIcon,
} from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"
import { Button } from "./button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"


interface DataTablePaginationProps<TData> {
    table: Table<TData>
}

export function DataTablePagination<TData>({
    table,
}: DataTablePaginationProps<TData>) {
    return (
        <div class名称="flex items-center justify-between px-2">
            <div class名称="flex-1 text-sm text-muted-foreground">
                {/*table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.*/}
            </div>
            <div class名称="flex items-center space-x-6 lg:space-x-8">
                <div class名称="flex items-center space-x-2">
                    <p class名称="text-sm font-medium">Rows per page</p>
                    <Select
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value))
                        }}
                    >
                        <SelectTrigger class名称="h-8 w-[70px]">
                            <SelectValue placeholder={table.getState().pagination.pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div class名称="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                </div>
                <div class名称="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        class名称="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span class名称="sr-only">Go to first page</span>
                        <DoubleArrowLeftIcon class名称="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        class名称="h-8 w-8 p-0"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span class名称="sr-only">Go to previous page</span>
                        <ChevronLeftIcon class名称="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        class名称="h-8 w-8 p-0"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <span class名称="sr-only">Go to next page</span>
                        <ChevronRightIcon class名称="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        class名称="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        <span class名称="sr-only">Go to last page</span>
                        <DoubleArrowRightIcon class名称="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

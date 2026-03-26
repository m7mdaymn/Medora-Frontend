'use client'

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ReactNode } from 'react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey: string
  filterColumn?: string
  filterOptions?: string[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  filterColumn,
  filterOptions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  // دالة مساعدة للتأكد من وجود العمود قبل محاولة الوصول إليه (منع الـ Console Error)
  const safeGetColumn = (key: string | undefined) => {
    if (!key) return null
    return table.getColumn(key)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-4'>
        <div className='relative max-w-sm w-full'>
          <Search className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          {/* تأمين حقل البحث */}
          <Input
            placeholder='بحث سريع...'
            value={(safeGetColumn(searchKey)?.getFilterValue() as string) ?? ''}
            onChange={(event) => safeGetColumn(searchKey)?.setFilterValue(event.target.value)}
            className='pr-10 pl-3 w-full md:w-75 text-right'
          />
        </div>

        <div className='flex items-center'>
          {/* تأمين حقل الفلترة (التخصص) */}
          {filterColumn && filterOptions && safeGetColumn(filterColumn) && (
            <Select
              value={(safeGetColumn(filterColumn)?.getFilterValue() as string) ?? 'all'}
              onValueChange={(value) =>
                safeGetColumn(filterColumn)?.setFilterValue(value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger className='w-45'>
                <SelectValue placeholder='تصفية بالتخصص' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>كل التخصصات</SelectItem>
                {filterOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* زرار مسح الفلاتر: التأكد من وجود القيم قبل العرض */}
          {(!!safeGetColumn(searchKey)?.getFilterValue() ||
            (filterColumn && !!safeGetColumn(filterColumn)?.getFilterValue())) && (
            <Button variant='link' onClick={() => table.resetColumnFilters()} className='px-2'>
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader className='h-12 bg-muted/50 '>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className='font-bold '>
                      {header.isPlaceholder
                        ? null
                        : (flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          ) as ReactNode)}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext()) as ReactNode}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  لا يوجد بيانات لعرضها
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-end gap-2 py-4'>
        <div className='text-sm text-muted-foreground ml-4'>
          صفحة {table.getState().pagination.pageIndex + 1} من {table.getPageCount()}
        </div>

        <Button
          variant='outline'
          size='icon'
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronRight className='h-4 w-4' />
        </Button>

        <Button
          variant='outline'
          size='icon'
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>
      </div>
    </div>
  )
}

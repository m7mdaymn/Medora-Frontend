'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GenericPagination } from '@/components/shared/pagination' // المكون بتاعك
import { IExpense } from '@/types/expense'
import { ExpenseRowActions } from './expense-row-actions'
import { AddExpenseDialog } from './add-expense-dialog'

interface Props {
  initialExpenses: IExpense[]
  tenantSlug: string
  pagination: {
    pageNumber: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export function ExpensesClient({ initialExpenses, tenantSlug, pagination }: Props) {
  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-black'>سجل المصروفات</h3>
        <AddExpenseDialog tenantSlug={tenantSlug} />
      </div>

      <div className='rounded-xl border bg-background overflow-hidden shadow-sm'>
        <Table dir='rtl'>
          <TableHeader className='bg-muted/30'>
            <TableRow>
              <TableHead className='font-bold text-right'>التاريخ</TableHead>
              <TableHead className='font-bold text-right'>البند</TableHead>
              <TableHead className='font-bold text-right'>المبلغ</TableHead>
              <TableHead className='font-bold text-right'>بواسطة</TableHead>
              <TableHead className='font-bold text-left'>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='h-32 text-center text-muted-foreground'>
                  لا توجد مصروفات مسجلة.
                </TableCell>
              </TableRow>
            ) : (
              initialExpenses.map((exp) => (
                <TableRow key={exp.id} className='hover:bg-muted/20 transition-colors'>
                  <TableCell className='text-sm text-muted-foreground'>
                    {new Date(exp.expenseDate).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell className='font-bold'>{exp.category}</TableCell>
                  <TableCell className='text-lg'>
                    {exp.amount.toLocaleString()}
                    <span className='text-[10px] font-sans'>ج.م</span>
                  </TableCell>
                  <TableCell className='text-xs font-medium'>{exp.recordedByName}</TableCell>
                  <TableCell className='text-left'>
                    <ExpenseRowActions exp={exp} tenantSlug={tenantSlug} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 🔴 الباجينيشن بيتحط هنا بره بوكس الجدول */}
      {pagination.totalPages > 1 && (
        <div className='flex justify-center pt-4'>
          <GenericPagination
            currentPage={pagination.pageNumber}
            totalPages={pagination.totalPages}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
          />
        </div>
      )}
    </div>
  )
}

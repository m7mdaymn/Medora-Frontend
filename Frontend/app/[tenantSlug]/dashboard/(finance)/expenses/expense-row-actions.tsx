'use client'

import { Edit, MoreHorizontal, Trash2, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { IExpense } from '@/types/expense'
import { ExpenseForm } from './expense-form'
import { ExpenseInput } from '@/validation/expense'
import { deleteExpenseAction, updateExpenseAction } from '../../../../../actions/finance/expenses'

export function ExpenseRowActions({ exp, tenantSlug }: { exp: IExpense; tenantSlug: string }) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const onEdit = async (data: ExpenseInput) => {
    const res = await updateExpenseAction(tenantSlug, exp.id, data)
    if (res.success) {
      toast.success('تم التعديل')
      setIsEditOpen(false)
    } else toast.error(res.message)
  }

  const onDelete = () => {
    startTransition(async () => {
      const res = await deleteExpenseAction(tenantSlug, exp.id)
      if (res.success) {
        toast.success('تم الحذف')
        setIsDeleteOpen(false)
      } else toast.error(res.message)
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsEditOpen(true)} className='gap-2 cursor-pointer'>
            <Edit className='h-4 w-4 text-muted-foreground' /> تعديل
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteOpen(true)}
            className='text-destructive gap-2 cursor-pointer focus:text-destructive'
          >
            <Trash2 className='h-4 w-4' /> حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المصروف</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            initialData={{ ...exp, expenseDate: exp.expenseDate.split('T')[0] } as ExpenseInput}
            onSubmit={onEdit}
            isSubmitting={false}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent dir='rtl'>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا المصروف نهائياً من سجلات العيادة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                onDelete()
              }}
              className='bg-destructive hover:bg-destructive/90'
              disabled={isPending}
            >
              {isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : 'نعم، احذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

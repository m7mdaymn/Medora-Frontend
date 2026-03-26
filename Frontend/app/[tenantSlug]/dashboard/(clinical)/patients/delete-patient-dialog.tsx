'use client'

import { Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deletePatientAction } from '../../../../../actions/patient/delete-patient'

export function DeletePatientDialog({
  patientId,
  patientName,
}: {
  patientId: string
  patientName: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const { tenantSlug } = useParams()

  const handleDelete = async (e: Event) => {
    e.preventDefault()
    setIsPending(true)

    try {
      const result = await deletePatientAction(patientId, tenantSlug as string)
      if (result.success) {
        toast.success(result.message)
        setOpen(false)
      } else {
        toast.error('لا يمكنك حذف المريض')
      }
    } catch (error) {
      if (error instanceof Error) toast.error('حدث خطأ غير متوقع')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <div className='relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-destructive hover:text-destructive-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 text-destructive'>
          حذف المريض
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد تماماً؟</AlertDialogTitle>
          <AlertDialogDescription>
            أنت على وشك حذف ملف المريض{' '}
            <span className='font-bold text-foreground'>{patientName}</span>. هذا الإجراء لا يمكن
            التراجع عنه وسيتم مسح كافة البيانات المرتبطة به.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => handleDelete(e as unknown as Event)}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            disabled={isPending}
          >
            {isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : 'تأكيد الحذف'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

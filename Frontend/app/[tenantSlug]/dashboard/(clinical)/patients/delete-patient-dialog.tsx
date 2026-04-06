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
} from '@/components/ui/alert-dialog'
import { deletePatientAction } from '../../../../../actions/patient/delete-patient'
import { DropdownMenuItem } from '../../../../../components/ui/dropdown-menu'

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
    <>
      <DropdownMenuItem
      variant='destructive'
        onSelect={(e) => {
          e.preventDefault() // بيمنع الـ Dropdown إنه يقفل ويعمل Unmount
          setOpen(true) // بيفتح المودال بتاعك بالـ State
        }}
        className='cursor-pointer flex items-center gap-2'
      >
        حذف المريض
        <span></span>
      </DropdownMenuItem>

      <AlertDialog open={open} onOpenChange={setOpen}>
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
              variant={'destructive'}
              disabled={isPending}
            >
              {isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : 'تأكيد الحذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

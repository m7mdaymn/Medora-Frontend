'use client'

import { cancelBookingAction } from '@/actions/booking/cancel-booking'
import { rescheduleBookingAction } from '@/actions/booking/reschedule-booking'
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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IBooking } from '@/types/booking'
import { AlertTriangle, Loader2, MoreHorizontal } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

interface Props {
  booking: IBooking
}

export function BookingRowActions({ booking }: Props) {
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // Reschedule State
  const [newDate, setNewDate] = useState<string>(booking.bookingDate.split('T')[0])
  const [newTime, setNewTime] = useState<string>(booking.bookingTime)

  const [isPending, startTransition] = useTransition()
  const { tenantSlug } = useParams()

  // 1. هندلة الإلغاء
  const handleCancel = async () => {
    if (!cancelReason) {
      toast.error('يرجى كتابة سبب الإلغاء')
      return
    }
    startTransition(async () => {
      const res = await cancelBookingAction(booking.id, cancelReason, tenantSlug as string)
      if (res.success) {
        toast.success(res.message)
        setIsCancelOpen(false)
      } else {
        toast.error(res.message)
      }
    })
  }

  // 2. هندلة التغيير
  const handleReschedule = async () => {
    startTransition(async () => {
      // دمج التاريخ والوقت لـ ISO لو الباك اند محتاجه كدة، أو ابعتهم منفصلين حسب الـ Action
      const res = await rescheduleBookingAction(booking.id, newDate, newTime, tenantSlug as string)
      if (res.success) {
        toast.success(res.message)
        setIsRescheduleOpen(false)
      } else {
        toast.error(res.message)
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='text-right'>
          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(booking.patientPhone)}>
            نسخ رقم الهاتف
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => setIsRescheduleOpen(true)}
            disabled={booking.isOperationalNow}
          >
            تغيير الموعد
          </DropdownMenuItem>

          <DropdownMenuItem
            className='text-destructive focus:text-destructive font-medium'
            onSelect={() => setIsCancelOpen(true)}
            disabled={booking.isOperationalNow}
          >
            إلغاء الحجز
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* --- Modal Reschedule --- */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className='sm:max-w-106.25 text-right' dir='rtl'>
          <DialogHeader>
            <DialogTitle>تغيير الموعد</DialogTitle>
            <DialogDescription>تعديل موعد حجز المريض: {booking.patientName}</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='date' className='text-right'>
                التاريخ
              </Label>
              <Input
                id='date'
                type='date'
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className='col-span-3'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='time' className='text-right'>
                الوقت
              </Label>
              <Input
                id='time'
                type='time'
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className='col-span-3'
              />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={isPending} onClick={handleReschedule}>
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Alert Cancel --- */}
      <AlertDialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <AlertDialogContent dir='rtl'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2 text-destructive'>
              <AlertTriangle className='h-5 w-5' />
              تأكيد الإلغاء
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className='py-2'>
            <Label className='mb-2 block'>سبب الإلغاء</Label>
            <Input
              placeholder='مثال: المريض اعتذر، الطبيب غير موجود...'
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleCancel()
              }}
              className='bg-destructive hover:bg-destructive/90'
              disabled={isPending}
            >
              {isPending ? 'جاري الإلغاء...' : 'نعم، قم بالإلغاء'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

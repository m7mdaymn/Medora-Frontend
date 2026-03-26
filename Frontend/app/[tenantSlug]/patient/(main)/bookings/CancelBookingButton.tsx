'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MessageCircle } from 'lucide-react'

// هنحتاج نمرر بيانات الحجز عشان نجهز الرسالة
interface Props {
  booking: {
    doctorName: string
    bookingDate: string
    bookingTime: string
  }
}

export function CancelBookingButton({ booking }: Props) {
  const [open, setOpen] = useState(false)

  const handleWhatsAppRedirect = () => {
    const clinicNumber = '201000000000' // حط رقم واتساب العيادة هنا
    const date = new Date(booking.bookingDate).toLocaleDateString('ar-EG')
    const message = `السلام عليكم، أرغب في إلغاء حجز الموعد الخاص بي:\n- دكتور: ${booking.doctorName}\n- تاريخ: ${date}\n- وقت: ${booking.bookingTime}`

    const url = `https://wa.me/${clinicNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='text-destructive border-destructive/20 hover:bg-destructive/5 rounded-xl'
        >
          طلب إلغاء
        </Button>
      </DialogTrigger>
      <DialogContent className='rounded-2xl max-w-[90vw]'>
        <DialogHeader>
          <DialogTitle className='text-right'>إلغاء الموعد</DialogTitle>
          <DialogDescription className='text-right'>
            سيتم توجيهك للمحادثة المباشرة مع العيادة على واتساب لإتمام عملية الإلغاء.
          </DialogDescription>
        </DialogHeader>

        <div className='bg-muted/30 p-4 rounded-xl space-y-2 text-sm text-right'>
          <p>
            <strong>الطبيب:</strong> {booking.doctorName}
          </p>
          <p>
            <strong>الموعد:</strong> {new Date(booking.bookingDate).toLocaleDateString('ar-EG')} -{' '}
            {booking.bookingTime}
          </p>
        </div>

        <DialogFooter className='flex-col gap-2'>
          <Button
            className='w-full rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white flex gap-2'
            onClick={handleWhatsAppRedirect}
          >
            <MessageCircle className='h-5 w-5' />
            تواصل عبر واتساب
          </Button>
          <Button variant='ghost' className='w-full' onClick={() => setOpen(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

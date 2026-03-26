'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { refundInvoiceAction } from '@/actions/finance/invoices'
import { IInvoice } from '@/types/visit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  invoice: IInvoice
  tenantSlug: string
  open: boolean
  setOpen: (open: boolean) => void
}

export function RefundInvoiceDialog({ invoice, tenantSlug, open, setOpen }: Props) {
  const [amount, setAmount] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [referenceNumber, setReferenceNumber] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleRefund = async () => {
    const numericAmount = Number(amount)
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      return toast.error('أدخل مبلغ صحيح أكبر من الصفر')
    }

    // التحقق المنطقي: مينفعش نرجع فلوس أكتر من اللي دخلت الدرج أساساً
    if (numericAmount > invoice.paidAmount) {
      return toast.error(`لا يمكن استرداد مبلغ أكبر من المدفوع (${invoice.paidAmount} ج.م)`)
    }

    if (!reason.trim()) {
      return toast.error('سبب الاسترداد إجباري للمراجعة المالية')
    }

    setLoading(true)
    const res = await refundInvoiceAction(tenantSlug, invoice.id, {
      amount: numericAmount,
      reason: reason.trim(),
      referenceNumber: referenceNumber.trim(),
    })
    setLoading(false)

    if (res.success) {
      toast.success('تم استرداد المبلغ بنجاح')
      setOpen(false)
      setAmount('')
      setReason('')
      setReferenceNumber('')
    } else {
      toast.error(res.message || 'حدث خطأ أثناء الاسترداد')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent dir='rtl' className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-destructive'>استرداد مبلغ (Refund)</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='flex justify-between p-3 bg-destructive/10 rounded-lg text-sm font-bold'>
            <span className='text-destructive'>إجمالي المدفوع القابل للاسترداد:</span>
            <span className='text-destructive'>{invoice.paidAmount} ج.م</span>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-xs font-bold'>المبلغ المُراد استرداده</label>
              <Input
                type='number'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder='0.00'
                disabled={loading}
              />
            </div>
            <div className='space-y-2'>
              <label className='text-xs font-bold'>رقم المرجع (اختياري)</label>
              <Input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder='رقم إيصال الفيزا...'
                disabled={loading}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-xs font-bold'>سبب الاسترداد (إجباري)</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='مثال: إلغاء الكشف، خطأ في الحساب...'
              disabled={loading}
              className='resize-none'
            />
          </div>
        </div>
        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant='outline' onClick={() => setOpen(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleRefund} disabled={loading} variant='destructive'>
            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            تأكيد الاسترداد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

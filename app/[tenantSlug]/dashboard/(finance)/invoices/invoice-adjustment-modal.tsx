'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { addInvoiceAdjustmentAction } from '@/actions/finance/invoices'
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

export function InvoiceAdjustmentDialog({ invoice, tenantSlug, open, setOpen }: Props) {
  const [amount, setAmount] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleAdjust = async () => {
    const numericAmount = Number(amount)

    // 1. Validation
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      return toast.error('يرجى إدخال مبلغ صحيح أكبر من الصفر')
    }
    if (!reason.trim()) {
      return toast.error('يرجى كتابة سبب الإضافة (إجباري للرقابة)')
    }

    setLoading(true)

    // 2. Submit to Action (المبلغ موجب دايماً لزيادة الفاتورة)
    const res = await addInvoiceAdjustmentAction(tenantSlug, invoice.id, {
      extraAmount: numericAmount,
      reason: reason.trim(),
    })

    setLoading(false)

    // 3. Handle Response
    if (res.success) {
      toast.success('تمت إضافة الرسوم للفاتورة بنجاح')
      setOpen(false)
      setAmount('')
      setReason('')
    } else {
      toast.error(res.message || 'حدث خطأ أثناء التعديل')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent dir='rtl' className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>إضافة رسوم للفاتورة</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='flex justify-between p-3 bg-muted rounded-lg text-sm font-bold'>
            <span>الإجمالي الحالي:</span>
            <span className='text-primary'>{invoice.amount} ج.م</span>
          </div>

          <div className='space-y-2'>
            <label className='text-xs font-bold'>قيمة الرسوم الإضافية (ج.م)</label>
            <Input
              type='number'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder='0.00'
              disabled={loading}
            />
          </div>

          <div className='space-y-2'>
            <label className='text-xs font-bold'>سبب الإضافة (للمراجعة)</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='مثال: رسوم كمامة، مستلزمات طبية...'
              disabled={loading}
              className='resize-none'
            />
          </div>
        </div>
        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant='outline' onClick={() => setOpen(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleAdjust} disabled={loading}>
            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            تأكيد الإضافة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

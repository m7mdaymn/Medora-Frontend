'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { addPaymentAction } from '@/actions/finance/invoices'
import { IInvoice } from '@/types/visit'
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

export function PaymentDialog({ invoice, tenantSlug, open, setOpen }: Props) {
  const [amount, setAmount] = useState<string>('')
  const [method, setMethod] = useState<string>('Cash')
  const [referenceNumber, setReferenceNumber] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    const numericAmount = Number(amount)
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      return toast.error('أدخل مبلغ صحيح')
    }
    if (numericAmount > invoice.remainingAmount) {
      return toast.error('المبلغ يتجاوز المتبقي من الفاتورة')
    }
    if (method !== 'Cash' && !referenceNumber.trim()) {
      return toast.error('رقم المرجع (رقم الإيصال) إجباري للدفع الإلكتروني')
    }

    setLoading(true)
    const res = await addPaymentAction(tenantSlug, {
      invoiceId: invoice.id,
      amount: numericAmount,
      paymentMethod: method,
      notes: 'دفعة من لوحة التحكم',
    })
    setLoading(false)

    if (res.success) {
      toast.success('تم تسجيل الدفعة بنجاح')
      setAmount('')
      setReferenceNumber('')
      setOpen(false)
    } else {
      toast.error(res.message || 'حدث خطأ')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent dir='rtl'>
        <DialogHeader>
          <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='flex justify-between p-3 bg-muted rounded-lg text-sm font-bold'>
            <span>المتبقي للدفع:</span>
            <span className='text-destructive'>{invoice.remainingAmount} ج.م</span>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-xs font-bold'>المبلغ (ج.م)</label>
              <Input
                type='number'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder='0.00'
                disabled={loading}
              />
            </div>
            <div className='space-y-2'>
              <label className='text-xs font-bold'>طريقة الدفع</label>
              <Select value={method} onValueChange={setMethod} disabled={loading} dir='rtl'>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Cash'>كاش</SelectItem>
                  <SelectItem value='Visa'>فيزا</SelectItem>
                  <SelectItem value='Transfer'>تحويل بنكي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {method !== 'Cash' && (
            <div className='space-y-2 animate-in fade-in zoom-in duration-200'>
              <label className='text-xs font-bold text-primary'>رقم المرجع / الإيصال</label>
              <Input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder='أدخل رقم إيصال الماكينة أو التحويل'
                disabled={loading}
              />
            </div>
          )}
        </div>
        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant='outline' onClick={() => setOpen(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handlePayment} disabled={loading}>
            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />} تأكيد الدفع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

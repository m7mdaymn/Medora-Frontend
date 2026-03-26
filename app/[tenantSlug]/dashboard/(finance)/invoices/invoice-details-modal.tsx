'use client'

import { getInvoiceByIdAction } from '@/actions/finance/invoices'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IInvoice } from '@/types/visit'
import {
  CreditCard,
  Eye,
  Loader2,
  ReceiptText,
  Stethoscope,
  UserCircle,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'

export function InvoiceDetailsAction({
  invoiceId,
  tenantSlug,
}: {
  invoiceId: string
  tenantSlug: string
}) {
  const [open, setOpen] = useState(false)
  const [invoice, setInvoice] = useState<IInvoice | null>(null)
  const [loading, setLoading] = useState(false)

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && !invoice) {
      setLoading(true)
      const res = await getInvoiceByIdAction(tenantSlug, invoiceId)
      if (res.success && res.data) {
        setInvoice(res.data)
      }
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div
          role='menuitem'
          className='relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground font-bold w-full'
          onClick={(e) => e.stopPropagation()}
        >
          <Eye className='w-4 h-4 ml-2 text-primary' /> عرض التفاصيل
        </div>
      </DialogTrigger>

      <DialogContent
        className='max-w-3xl p-0 gap-0 overflow-hidden bg-background sm:rounded-xl'
        dir='rtl'
      >
        {/* الهيدر والملخص (كما هو في كودك) */}
        <div className='bg-muted/50 px-6 py-4 border-b border-border'>
          <DialogHeader>
            <div className='flex items-center justify-between'>
              <DialogTitle className='flex items-center gap-2 text-lg font-bold text-foreground'>
                <ReceiptText className='w-5 h-5 text-muted-foreground' />
                تفاصيل الفاتورة
                {!loading && invoice && (
                  <span className='text-muted-foreground font-mono font-medium text-sm mr-2'>
                    #{invoice.invoiceNumber}
                  </span>
                )}
              </DialogTitle>
              {!loading && invoice && <StatusBadge status={invoice.status} />}
            </div>
          </DialogHeader>
        </div>

        <div className='max-h-[80vh] overflow-y-auto px-6 py-6'>
          {loading ? (
            <div className='flex flex-col justify-center items-center py-20'>
              <Loader2 className='w-8 h-8 animate-spin text-primary mb-4' />
              <p className='text-muted-foreground text-sm font-medium'>جاري تحميل البيانات...</p>
            </div>
          ) : !invoice ? (
            <div className='flex flex-col justify-center items-center py-20'>
              <ReceiptText className='w-12 h-12 text-muted-foreground/30 mb-4' />
              <p className='text-muted-foreground font-medium'>حدث خطأ في تحميل الفاتورة</p>
            </div>
          ) : (
            <div className='space-y-8'>
              {/* بيانات المريض والطبيب */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='flex flex-col justify-center p-4 rounded-lg border bg-card'>
                  <div className='flex items-center gap-2 mb-1 text-muted-foreground'>
                    <UserCircle className='w-4 h-4' />
                    <span className='text-xs font-semibold'>المريض</span>
                  </div>
                  <p className='text-base font-bold text-foreground pr-6'>{invoice.patientName}</p>
                </div>
                <div className='flex flex-col justify-center p-4 rounded-lg border bg-card'>
                  <div className='flex items-center gap-2 mb-1 text-muted-foreground'>
                    <Stethoscope className='w-4 h-4' />
                    <span className='text-xs font-semibold'>الطبيب المعالج</span>
                  </div>
                  <p className='text-base font-bold text-foreground pr-6'>
                    د. {invoice.doctorName}
                  </p>
                </div>
              </div>

              {/* الخدمات المضافة (Line Items) - جديد 🔥 */}
              {invoice.lineItems && invoice.lineItems.length > 0 && (
                <div className='space-y-3'>
                  <h3 className='font-bold text-sm flex items-center gap-2 text-foreground px-1'>
                    <ReceiptText className='w-4 h-4 text-muted-foreground' /> تفاصيل الخدمات
                  </h3>
                  <div className='border rounded-lg overflow-hidden bg-card'>
                    <Table>
                      <TableHeader className='bg-muted/50'>
                        <TableRow>
                          <TableHead className='font-semibold text-xs text-muted-foreground'>
                            الخدمة / الصنف
                          </TableHead>
                          <TableHead className='font-semibold text-xs text-muted-foreground'>
                            الكمية
                          </TableHead>
                          <TableHead className='font-semibold text-xs text-muted-foreground'>
                            الإجمالي
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.lineItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className='font-bold text-sm'>{item.itemName}</TableCell>
                            <TableCell>
                              {item.quantity} × {item.unitPrice}
                            </TableCell>
                            <TableCell className='font-bold text-primary'>
                              {item.totalPrice} ج.م
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* الملخص المالي وسجل الدفعات (كما هو في كودك) */}
              <div className='rounded-lg border bg-card overflow-hidden'>
                <div className='px-4 py-3 bg-muted/50 border-b flex items-center gap-2'>
                  <Wallet className='w-4 h-4 text-muted-foreground' />
                  <h3 className='text-sm font-bold'>الملخص المالي</h3>
                </div>
                <div className='divide-y divide-border'>
                  <div className='flex justify-between items-center px-4 py-3'>
                    <span className='text-sm text-muted-foreground'>إجمالي الفاتورة</span>
                    <span className='font-bold text-foreground'>{invoice.amount} ج.م</span>
                  </div>
                  <div className='flex justify-between items-center px-4 py-3'>
                    <span className='text-sm text-muted-foreground'>المدفوع</span>
                    <span className='font-bold text-primary'>{invoice.paidAmount} ج.م</span>
                  </div>
                  <div className='flex justify-between items-center px-4 py-3 bg-muted/20'>
                    <span className='text-sm font-bold text-foreground'>المبلغ المتبقي</span>
                    <span className='text-lg font-black text-destructive'>
                      {invoice.remainingAmount} ج.م
                    </span>
                  </div>
                  {invoice.pendingSettlementAmount > 0 && (
                    <div className='flex justify-between items-center px-4 py-3 bg-orange-500/10'>
                      <span className='text-sm font-bold text-orange-600'>
                        مبلغ معلق (خدمات إضافية)
                      </span>
                      <span className='font-bold text-orange-600'>
                        {invoice.pendingSettlementAmount} ج.م
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* سجل الدفعات */}
              <div className='space-y-3'>
                <h3 className='font-bold text-sm flex items-center gap-2 text-foreground px-1'>
                  <CreditCard className='w-4 h-4 text-muted-foreground' /> سجل الدفعات
                </h3>
                <div className='border rounded-lg overflow-hidden bg-card'>
                  <Table>
                    <TableHeader className='bg-muted/50'>
                      <TableRow>
                        <TableHead className='font-semibold text-xs text-muted-foreground'>
                          التاريخ
                        </TableHead>
                        <TableHead className='font-semibold text-xs text-muted-foreground'>
                          المبلغ
                        </TableHead>
                        <TableHead className='font-semibold text-xs text-muted-foreground'>
                          النوع
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.payments && invoice.payments.length > 0 ? (
                        invoice.payments.map((payment) => (
                          <TableRow
                            key={payment.id}
                            className={payment.isRefund ? 'bg-destructive/5' : ''}
                          >
                            <TableCell className='text-xs font-mono'>
                              {new Date(payment.createdAt).toLocaleString('ar-EG')}
                            </TableCell>
                            <TableCell
                              className={`font-bold text-sm ${payment.isRefund ? 'text-destructive' : 'text-foreground'}`}
                            >
                              {payment.amount} ج.م
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={payment.isRefund ? 'destructive' : 'outline'}
                                className='text-xs'
                              >
                                {payment.isRefund ? 'استرداد (Refund)' : payment.paymentMethod}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className='text-center text-muted-foreground py-10'
                          >
                            لا توجد أي عمليات دفع
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Paid')
    return (
      <Badge variant='secondary' className='bg-primary/10 text-primary'>
        مدفوعة
      </Badge>
    )
  if (status === 'PartiallyPaid') return <Badge variant='secondary'>دفع جزئي</Badge>
  return (
    <Badge variant='destructive' className='bg-destructive/10 text-destructive'>
      غير مدفوعة
    </Badge>
  )
}

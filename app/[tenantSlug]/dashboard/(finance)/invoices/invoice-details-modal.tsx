'use client'

import { getInvoiceByIdAction } from '@/actions/finance/invoices'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IInvoice } from '@/types/visit'
import { Eye, Loader2, ReceiptText } from 'lucide-react'
import { useState } from 'react'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

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

  return (
    <>
      <DropdownMenuItem
        onSelect={async (e) => {
          e.preventDefault()
          setOpen(true)

          if (!invoice) {
            setLoading(true)
            try {
              const res = await getInvoiceByIdAction(tenantSlug, invoiceId)
              if (res.success && res.data) {
                setInvoice(res.data)
              }
            } catch (error) {
              console.error('Failed to fetch invoice', error)
            } finally {
              setLoading(false)
            }
          }
        }}
        className='cursor-pointer flex items-center gap-2'
      >
        <Eye className='size-4 text-muted-foreground' />
        <span>عرض التفاصيل</span>
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className='max-w-2xl p-0 gap-0 overflow-hidden bg-background shadow-2xl border-border/40 sm:rounded-2xl'
          dir='rtl'
        >
          {/* Header - Minimal Vercel Style */}
          <DialogHeader className='px-6 py-5 border-b border-border/40'>
            <div className='flex items-center justify-between'>
              <DialogTitle className='flex items-center gap-2 text-base font-semibold'>
                <div className='size-8 rounded-full bg-primary/10 flex items-center justify-center'>
                  <ReceiptText className='size-4 text-primary' />
                </div>
                تفاصيل الفاتورة
              </DialogTitle>
              {!loading && invoice && (
                <div className='flex items-center gap-3'>
                  <span className='font-mono text-sm text-muted-foreground uppercase tracking-widest'>
                    INV-{invoice.invoiceNumber}
                  </span>
                  <StatusBadge status={invoice.status} />
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Content Area */}
          <div className='max-h-[75vh] overflow-y-auto'>
            {loading ? (
              <div className='flex flex-col justify-center items-center py-32 space-y-4'>
                <Loader2 className='size-6 animate-spin text-muted-foreground' />
                <p className='text-xs text-muted-foreground font-mono uppercase tracking-widest'>
                  جاري التحميل...
                </p>
              </div>
            ) : !invoice ? (
              <div className='flex flex-col justify-center items-center py-32 space-y-3'>
                <ReceiptText className='size-10 text-muted-foreground/20' />
                <p className='text-sm text-muted-foreground font-medium'>
                  تعذر العثور على بيانات الفاتورة
                </p>
              </div>
            ) : (
              <div className='p-0'>
                {/* Meta Info - Vercel Grid */}
                <div className='grid grid-cols-2 gap-px bg-border/40 border-b border-border/40'>
                  <div className='bg-background p-6 flex flex-col gap-1'>
                    <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                      المريض 
                    </span>
                    <span className='text-sm font-semibold text-foreground'>
                      {invoice.patientName}
                    </span>
                  </div>
                  <div className='bg-background p-6 flex flex-col gap-1'>
                    <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                      الطبيب المعالج
                    </span>
                    <span className='text-sm font-semibold text-foreground'>
                      د. {invoice.doctorName}
                    </span>
                  </div>
                </div>

                <div className='p-6 space-y-8'>
                  {/* Line Items - Clean Table */}
                  {invoice.lineItems && invoice.lineItems.length > 0 && (
                    <div className='space-y-3'>
                      <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                        الخدمات المقدمة
                      </h3>
                      <div className='rounded-lg border border-border/50 overflow-hidden'>
                        <Table>
                          <TableHeader className='bg-muted/30'>
                            <TableRow className='hover:bg-transparent'>
                              <TableHead className='h-9 text-xs font-medium'>الوصف</TableHead>
                              <TableHead className='h-9 text-xs font-medium'>الكمية</TableHead>
                              <TableHead className='h-9 text-xs font-medium text-left'>
                                القيمة
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoice.lineItems.map((item) => (
                              <TableRow
                                key={item.id}
                                className='hover:bg-muted/10 border-border/40'
                              >
                                <TableCell className='py-3 text-sm font-medium'>
                                  {item.itemName}
                                </TableCell>
                                <TableCell className='py-3 text-xs font-mono text-muted-foreground'>
                                  {item.quantity} × {item.unitPrice}
                                </TableCell>
                                <TableCell className='py-3 text-sm font-mono font-semibold text-left'>
                                  {item.totalPrice} ج.م
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Payments History - Minimalist */}
                  <div className='space-y-3'>
                    <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                      سجل الدفعات
                    </h3>
                    <div className='rounded-lg border border-border/50 overflow-hidden'>
                      <Table>
                        <TableBody>
                          {invoice.payments && invoice.payments.length > 0 ? (
                            invoice.payments.map((payment) => (
                              <TableRow
                                key={payment.id}
                                className={
                                  payment.isRefund
                                    ? 'bg-destructive/5 hover:bg-destructive/10'
                                    : 'hover:bg-muted/10'
                                }
                              >
                                <TableCell className='py-3 text-xs font-mono text-muted-foreground'>
                                  {new Date(payment.createdAt).toLocaleDateString('ar-EG')}
                                </TableCell>
                                <TableCell className='py-3'>
                                  <Badge
                                    variant={payment.isRefund ? 'destructive' : 'outline'}
                                    className='text-[10px] font-medium rounded-sm shadow-none'
                                  >
                                    {payment.isRefund ? 'استرداد' : payment.paymentMethod}
                                  </Badge>
                                </TableCell>
                                <TableCell
                                  className={`py-3 text-sm font-mono font-bold text-left ${payment.isRefund ? 'text-destructive' : 'text-foreground'}`}
                                >
                                  {payment.isRefund ? '' : '+'}
                                  {payment.amount} ج.م
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className='h-20 text-center text-xs text-muted-foreground'
                              >
                                لا توجد حركات مالية مسجلة
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Financial Summary - Right Aligned Math */}
                  <div className='flex justify-end pt-4'>
                    <div className='w-full sm:w-1/2 space-y-3'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>الإجمالي</span>
                        <span className='font-mono font-medium'>{invoice.amount} ج.م</span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>المدفوع</span>
                        <span className='font-mono font-medium text-emerald-600'>
                          {invoice.paidAmount} ج.م
                        </span>
                      </div>
                      <div className='flex justify-between text-sm pt-3 border-t border-border/50'>
                        <span className='font-bold'>المتبقي</span>
                        <span className='font-mono font-bold text-base'>
                          {invoice.remainingAmount} ج.م
                        </span>
                      </div>

                      {invoice.pendingSettlementAmount > 0 && (
                        <div className='flex justify-between text-xs p-2 rounded bg-amber-500/10 text-amber-600 mt-2'>
                          <span className='font-semibold'>مبلغ معلق (خدمات إضافية)</span>
                          <span className='font-mono font-bold'>
                            {invoice.pendingSettlementAmount} ج.م
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Paid')
    return (
      <div className='flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-md border border-emerald-500/20'>
        <div className='size-1.5 rounded-full bg-emerald-500' />
        <span className='text-[10px] font-bold uppercase tracking-wider'>مدفوعة</span>
      </div>
    )
  if (status === 'PartiallyPaid')
    return (
      <div className='flex items-center gap-1.5 bg-amber-500/10 text-amber-600 px-2 py-1 rounded-md border border-amber-500/20'>
        <div className='size-1.5 rounded-full bg-amber-500' />
        <span className='text-[10px] font-bold uppercase tracking-wider'>دفع جزئي</span>
      </div>
    )
  return (
    <div className='flex items-center gap-1.5 bg-destructive/10 text-destructive px-2 py-1 rounded-md border border-destructive/20'>
      <div className='size-1.5 rounded-full bg-destructive' />
      <span className='text-[10px] font-bold uppercase tracking-wider'>غير مدفوعة</span>
    </div>
  )
}

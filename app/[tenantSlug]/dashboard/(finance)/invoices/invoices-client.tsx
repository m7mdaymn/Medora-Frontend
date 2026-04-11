'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IInvoice } from '@/types/visit'
import { Calculator, MoreHorizontal, Plus, Search, Undo2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { GenericPagination } from '../../../../../components/shared/pagination'
import { InvoiceAdjustmentDialog } from './invoice-adjustment-modal'
import { InvoiceDetailsAction } from './invoice-details-modal'
import { PaymentDialog } from './payment-modal'
import { RefundInvoiceDialog } from './refund-invoice-modal'

interface InvoicesClientProps {
  initialInvoices: IInvoice[]
  tenantSlug: string
  pagination: {
    pageNumber: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export function InvoicesClient({ initialInvoices, tenantSlug, pagination }: InvoicesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('invoiceNumber') || '')

  const [adjustingInvoice, setAdjustingInvoice] = useState<IInvoice | null>(null)
  const [payingInvoice, setPayingInvoice] = useState<IInvoice | null>(null)
  const [refundingInvoice, setRefundingInvoice] = useState<IInvoice | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchQuery.trim()) params.set('invoiceNumber', searchQuery.trim())
    else params.delete('invoiceNumber')

    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className='space-y-4'>
      {/* Search Form */}
      <form onSubmit={handleSearch} className='flex items-center gap-2 max-w-sm'>
        <div className='relative flex-1'>
          <Search className='absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='ابحث برقم الفاتورة...'
            className='pr-9'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button type='submit' variant='secondary'>
          بحث
        </Button>
      </form>

      {/* Table */}
      <div className='border rounded-md overflow-hidden shadow-sm '>
        <Table>
          <TableHeader className='bg-muted/50 h-12'>
            <TableRow>
              <TableHead className='font-bold text-muted-foreground'>رقم الفاتورة</TableHead>
              <TableHead className='font-bold text-muted-foreground'>التاريخ</TableHead>
              <TableHead className='font-bold text-muted-foreground'>المريض</TableHead>
              <TableHead className='font-bold text-muted-foreground'>الإجمالي</TableHead>
              <TableHead className='font-bold text-muted-foreground'>المتبقي</TableHead>
              <TableHead className='font-bold text-muted-foreground'>الحالة</TableHead>
              <TableHead className='font-bold text-center w-16 text-muted-foreground'>
                إجراءات
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialInvoices.length > 0 ? (
              initialInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className='text-xs text-muted-foreground font-bold'>
                    {inv.invoiceNumber}
                  </TableCell>
                  <TableCell className='text-sm whitespace-nowrap'>
                    {new Date(inv.createdAt).toLocaleDateString('en')}
                  </TableCell>
                  <TableCell className='font-bold'>{inv.patientName}</TableCell>
                  <TableCell className='font-bold'>{inv.amount} ج.م</TableCell>
                  <TableCell className='font-bold text-destructive'>
                    {inv.remainingAmount} ج.م
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status} />
                  </TableCell>
                  <TableCell className='text-center'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' className='w-48'>
                        <DropdownMenuLabel className='text-xs'>خيارات الفاتورة</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <InvoiceDetailsAction invoiceId={inv.id} tenantSlug={tenantSlug} />

                        <DropdownMenuItem
                          onClick={() => setAdjustingInvoice(inv)}
                          className='cursor-pointer'
                        >
                          <Calculator className='h-4 w-4' /> الرسوم الإضافية
                        </DropdownMenuItem>

                        {inv.status !== 'Paid' && (
                          <DropdownMenuItem onClick={() => setPayingInvoice(inv)}>
                            <Plus className='h-4 w-4' /> تسجيل دفعة
                          </DropdownMenuItem>
                        )}

                        {inv.paidAmount > 0 && (
                          <DropdownMenuItem
                            onClick={() => setRefundingInvoice(inv)}
                            variant='destructive'
                          >
                            <Undo2 className='h-4 w-4 ml-2' /> استرداد مبلغ
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className='h-32 text-center text-muted-foreground font-medium'
                >
                  لا توجد فواتير لعرضها
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {initialInvoices.length > 0 && (
        <GenericPagination
          currentPage={pagination.pageNumber}
          totalPages={pagination.totalPages}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
        />
      )}

      {/* Modals */}
      {adjustingInvoice && (
        <InvoiceAdjustmentDialog
          invoice={adjustingInvoice}
          tenantSlug={tenantSlug}
          open={!!adjustingInvoice}
          setOpen={(open) => !open && setAdjustingInvoice(null)}
        />
      )}
      {payingInvoice && (
        <PaymentDialog
          invoice={payingInvoice}
          tenantSlug={tenantSlug}
          open={!!payingInvoice}
          setOpen={(open) => !open && setPayingInvoice(null)}
        />
      )}
      {refundingInvoice && (
        <RefundInvoiceDialog
          invoice={refundingInvoice}
          tenantSlug={tenantSlug}
          open={!!refundingInvoice}
          setOpen={(open) => !open && setRefundingInvoice(null)}
        />
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Paid')
    return (
      <Badge variant='secondary' className='bg-primary/10 text-primary hover:bg-primary/20'>
        مدفوعة
      </Badge>
    )

  if (status === 'PartiallyPaid') return <Badge variant='secondary'>دفع جزئي</Badge>
  if (status === 'Refunded') return <Badge variant='secondary'>مرتجع</Badge>
  return <Badge variant='destructive'>غير مدفوعة</Badge>
}

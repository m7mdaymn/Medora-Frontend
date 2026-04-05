'use client'

import {
  listMarketplaceOrdersAction,
  updateMarketplaceOrderStatusAction,
} from '@/actions/marketplace/orders'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { IMarketplaceOrder, MarketplaceOrderStatus } from '@/types/marketplace'
import { ShoppingBag } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

const STATUS_OPTIONS: MarketplaceOrderStatus[] = [
  'Pending',
  'WhatsAppRedirected',
  'Confirmed',
  'Cancelled',
]

function statusLabel(status: MarketplaceOrderStatus): string {
  switch (status) {
    case 'Pending':
      return 'جديد'
    case 'WhatsAppRedirected':
      return 'تم التحويل واتساب'
    case 'Confirmed':
      return 'مؤكد'
    case 'Cancelled':
      return 'ملغي'
    default:
      return status
  }
}

function statusVariant(status: MarketplaceOrderStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'Confirmed':
      return 'default'
    case 'Cancelled':
      return 'destructive'
    case 'WhatsAppRedirected':
      return 'secondary'
    default:
      return 'outline'
  }
}

export default function MarketplaceOrdersPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const [search, setSearch] = useState('')
  const [isSavingOrderId, setIsSavingOrderId] = useState<string | null>(null)

  const {
    data: ordersRes,
    isLoading,
    mutate,
  } = useSWR(['marketplace-orders', tenantSlug, search], () =>
    listMarketplaceOrdersAction(tenantSlug, {
      pageNumber: 1,
      pageSize: 100,
      search: search || undefined,
    }),
  )

  const orders = ordersRes?.data?.items || []

  const updateStatus = async (order: IMarketplaceOrder, status: MarketplaceOrderStatus) => {
    setIsSavingOrderId(order.id)
    try {
      const response = await updateMarketplaceOrderStatusAction(tenantSlug, order.id, {
        status,
        notes: `Status updated from dashboard: ${status}`,
      })

      if (!response.success) {
        toast.error(response.message || 'فشل تحديث الحالة')
        return
      }

      toast.success('تم تحديث الحالة')
      await mutate()
    } finally {
      setIsSavingOrderId(null)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading='طلبات المتجر'
        text='متابعة طلبات المنتجات الواردة من الصفحة العامة وتحديث حالتها'
      />

      <Card className='rounded-2xl border-border/50 p-4'>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder='ابحث بالعميل أو الهاتف'
        />
      </Card>

      {isLoading ? (
        <div className='space-y-2'>
          <Skeleton className='h-24 w-full rounded-2xl' />
          <Skeleton className='h-24 w-full rounded-2xl' />
        </div>
      ) : orders.length === 0 ? (
        <Card className='rounded-2xl p-10 text-center text-muted-foreground'>
          لا توجد طلبات متجر حالياً.
        </Card>
      ) : (
        <div className='space-y-3'>
          {orders.map((order) => (
            <Card key={order.id} className='rounded-2xl border-border/50 p-4 space-y-3'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='text-sm font-bold'>{order.customerName}</p>
                  <p className='text-xs text-muted-foreground'>{order.phone}</p>
                </div>
                <Badge variant={statusVariant(order.status)}>{statusLabel(order.status)}</Badge>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground'>
                <div className='rounded-lg border border-border/50 p-2'>
                  إجمالي الطلب: {order.totalAmount.toLocaleString('ar-EG')} ج.م
                </div>
                <div className='rounded-lg border border-border/50 p-2'>
                  عدد الأصناف: {order.items.length}
                </div>
                <div className='rounded-lg border border-border/50 p-2'>
                  تاريخ الإنشاء: {new Date(order.createdAt).toLocaleString('ar-EG')}
                </div>
              </div>

              {order.items.length > 0 && (
                <div className='rounded-lg bg-muted/20 p-2 space-y-1'>
                  {order.items.map((item) => (
                    <p key={item.id} className='text-xs'>
                      <ShoppingBag className='inline w-3.5 h-3.5 ml-1 text-muted-foreground' />
                      {item.itemName} — {item.quantity} × {item.unitPrice.toLocaleString('ar-EG')} ج.م
                    </p>
                  ))}
                </div>
              )}

              <div className='flex flex-wrap gap-2'>
                {STATUS_OPTIONS.filter((status) => status !== order.status).map((status) => (
                  <Button
                    key={status}
                    size='sm'
                    variant='outline'
                    disabled={isSavingOrderId === order.id}
                    onClick={() => void updateStatus(order, status)}
                  >
                    تحويل إلى {statusLabel(status)}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}

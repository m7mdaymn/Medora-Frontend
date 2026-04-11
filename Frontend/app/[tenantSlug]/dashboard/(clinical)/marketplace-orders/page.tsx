'use client'

import {
  createPublicMarketplaceOrderAction,
  getPublicLandingAction,
  getPublicMarketplaceItemsAction,
} from '@/actions/public/landing'
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
import { IPublicMarketplaceItem } from '@/types/public'
import { ShoppingBag } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
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
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({})
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)

  const { data: landingRes, isLoading: isLoadingLanding } = useSWR(['public-landing', tenantSlug], () =>
    getPublicLandingAction(tenantSlug),
  )

  const branches = landingRes?.data?.branches || []

  useEffect(() => {
    if (!selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0].id)
    }
  }, [branches, selectedBranchId])

  const {
    data: publicItemsRes,
    isLoading: isLoadingPublicItems,
    mutate: mutatePublicItems,
  } = useSWR(
    selectedBranchId ? ['public-marketplace-items', tenantSlug, selectedBranchId] : null,
    () =>
      getPublicMarketplaceItemsAction(tenantSlug, {
        branchId: selectedBranchId,
        pageNumber: 1,
        pageSize: 100,
      }),
  )

  const publicItems = useMemo(
    () => publicItemsRes?.data?.items || [],
    [publicItemsRes?.data?.items],
  )

  const selectedItems = useMemo(
    () =>
      publicItems
        .map((item) => ({
          item,
          quantity: itemQuantities[item.id] || 0,
        }))
        .filter((row) => row.quantity > 0),
    [itemQuantities, publicItems],
  )

  const selectedItemsTotal = useMemo(
    () => selectedItems.reduce((sum, row) => sum + row.item.salePrice * row.quantity, 0),
    [selectedItems],
  )

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

  const setItemQuantity = (itemId: string, nextValue: string) => {
    const parsedValue = Number(nextValue)

    setItemQuantities((prev) => {
      if (!nextValue || Number.isNaN(parsedValue) || parsedValue <= 0) {
        const next = { ...prev }
        delete next[itemId]
        return next
      }

      return {
        ...prev,
        [itemId]: Math.floor(parsedValue),
      }
    })
  }

  const createManualOrder = async () => {
    if (!selectedBranchId) {
      toast.error('اختر الفرع أولاً')
      return
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('اسم العميل ورقم الهاتف مطلوبان')
      return
    }

    if (selectedItems.length === 0) {
      toast.error('اختر صنفاً واحداً على الأقل')
      return
    }

    setIsCreatingOrder(true)
    try {
      const response = await createPublicMarketplaceOrderAction(tenantSlug, {
        customerName: customerName.trim(),
        phone: customerPhone.trim(),
        branchId: selectedBranchId,
        notes: customerNotes.trim() || undefined,
        items: selectedItems.map((row) => ({
          inventoryItemId: row.item.id,
          quantity: row.quantity,
        })),
      })

      if (!response.success) {
        toast.error(response.message || 'فشل إنشاء الطلب اليدوي')
        return
      }

      toast.success('تم إنشاء الطلب اليدوي بنجاح')
      setCustomerName('')
      setCustomerPhone('')
      setCustomerNotes('')
      setItemQuantities({})
      await Promise.all([mutate(), mutatePublicItems()])
    } finally {
      setIsCreatingOrder(false)
    }
  }

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
        text='متابعة الطلبات الواردة وإنشاء طلب يدوي سريع من داخل لوحة العيادة'
      />

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
        <Card className='rounded-2xl border-border/50 p-4 space-y-4'>
          <div>
            <h3 className='font-bold text-sm'>إنشاء طلب يدوي</h3>
            <p className='text-xs text-muted-foreground mt-1'>
              استخدم هذا النموذج لإضافة طلب عميل مباشرة دون المرور بالصفحة العامة.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            <div className='space-y-2'>
              <label className='text-xs text-muted-foreground'>الفرع</label>
              <select
                value={selectedBranchId}
                onChange={(event) => {
                  setSelectedBranchId(event.target.value)
                  setItemQuantities({})
                }}
                disabled={isLoadingLanding || branches.length === 0}
                className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
              >
                {branches.length === 0 ? (
                  <option value=''>لا توجد فروع متاحة</option>
                ) : null}
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-2'>
              <label className='text-xs text-muted-foreground'>اسم العميل</label>
              <Input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder='مثال: أحمد محمد'
              />
            </div>

            <div className='space-y-2'>
              <label className='text-xs text-muted-foreground'>رقم الهاتف</label>
              <Input
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder='01xxxxxxxxx'
              />
            </div>

            <div className='space-y-2'>
              <label className='text-xs text-muted-foreground'>ملاحظات (اختياري)</label>
              <Input
                value={customerNotes}
                onChange={(event) => setCustomerNotes(event.target.value)}
                placeholder='ملاحظات الطلب'
              />
            </div>
          </div>

          <div className='rounded-xl border border-border/50 p-3 space-y-2'>
            <p className='text-xs text-muted-foreground'>الأصناف المتاحة</p>
            {isLoadingPublicItems ? (
              <Skeleton className='h-20 w-full rounded-lg' />
            ) : publicItems.length === 0 ? (
              <p className='text-sm text-muted-foreground'>لا توجد أصناف متاحة في هذا الفرع حالياً.</p>
            ) : (
              <div className='space-y-2 max-h-56 overflow-y-auto pr-1'>
                {publicItems.map((item: IPublicMarketplaceItem) => (
                  <div
                    key={item.id}
                    className='rounded-lg border border-border/40 p-2 flex items-center justify-between gap-3'
                  >
                    <div>
                      <p className='text-sm font-semibold'>{item.name}</p>
                      <p className='text-xs text-muted-foreground'>
                        {item.salePrice.toLocaleString('ar-EG')} ج.م • متاح {item.quantityOnHand}
                      </p>
                    </div>
                    <Input
                      type='number'
                      min={0}
                      className='w-20'
                      value={itemQuantities[item.id] ?? ''}
                      onChange={(event) => setItemQuantity(item.id, event.target.value)}
                      placeholder='0'
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className='rounded-xl bg-muted/20 p-3'>
            <p className='text-xs text-muted-foreground'>ملخص الطلب</p>
            <p className='text-sm mt-1'>عدد الأصناف المختارة: {selectedItems.length}</p>
            <p className='text-sm font-semibold'>
              الإجمالي المتوقع: {selectedItemsTotal.toLocaleString('ar-EG')} ج.م
            </p>
          </div>

          <Button
            type='button'
            onClick={() => void createManualOrder()}
            disabled={isCreatingOrder || selectedItems.length === 0}
          >
            {isCreatingOrder ? 'جارٍ إنشاء الطلب...' : 'إنشاء الطلب اليدوي'}
          </Button>
        </Card>

        <Card className='rounded-2xl border-border/50 p-4 space-y-3'>
          <h3 className='font-bold text-sm'>البحث داخل الطلبات</h3>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='ابحث بالعميل أو الهاتف'
          />
          <div className='rounded-xl border border-border/50 p-3 text-sm'>
            إجمالي الطلبات الحالية: <span className='font-bold'>{orders.length}</span>
          </div>
        </Card>
      </div>

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

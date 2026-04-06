'use client'

import {
  createPublicMarketplaceOrderAction,
  getPublicLandingAction,
  getPublicMarketplaceItemsAction,
} from '@/actions/public/landing'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IPublicMarketplaceItem } from '@/types/public'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

export default function PublicMarketplacePage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: landingRes } = useSWR(['public-landing', tenantSlug], () =>
    getPublicLandingAction(tenantSlug),
  )

  const branches = useMemo(() => landingRes?.data?.branches ?? [], [landingRes?.data?.branches])
  const supportWhatsApp = landingRes?.data?.clinic?.supportWhatsAppNumber || ''

  const effectiveBranchId = selectedBranchId || branches[0]?.id || ''

  const { data: itemsRes, isLoading } = useSWR(['public-marketplace', tenantSlug, effectiveBranchId], () =>
    getPublicMarketplaceItemsAction(tenantSlug, {
      branchId: effectiveBranchId || undefined,
      pageNumber: 1,
      pageSize: 100,
    }),
  )

  const items = useMemo(() => itemsRes?.data?.items ?? [], [itemsRes?.data?.items])

  const selectedItems = useMemo(
    () => items.filter((item) => (quantities[item.id] || 0) > 0),
    [items, quantities],
  )

  const total = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) => sum + item.salePrice * (quantities[item.id] || 0),
        0,
      ),
    [selectedItems, quantities],
  )

  const updateQuantity = (item: IPublicMarketplaceItem, value: string) => {
    const parsed = Number(value)
    setQuantities((current) => ({
      ...current,
      [item.id]: Number.isNaN(parsed) ? 0 : Math.max(0, parsed),
    }))
  }

  const submitOrder = async (event: FormEvent) => {
    event.preventDefault()

    if (!customerName.trim() || !phone.trim()) {
      toast.error('الاسم ورقم الهاتف مطلوبان')
      return
    }

    if (selectedItems.length === 0) {
      toast.error('اختر صنفاً واحداً على الأقل')
      return
    }

    if (!effectiveBranchId) {
      toast.error('اختر الفرع أولاً')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await createPublicMarketplaceOrderAction(tenantSlug, {
        customerName: customerName.trim(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,
        branchId: effectiveBranchId,
        items: selectedItems.map((item) => ({
          inventoryItemId: item.id,
          quantity: quantities[item.id] || 0,
        })),
      })

      if (!response.success) {
        toast.error(response.message || 'فشل إرسال الطلب')
        return
      }

      const orderId = response.data?.id || ''
      const branchName = branches.find((branch) => branch.id === effectiveBranchId)?.name || 'الفرع'
      const waNumber = supportWhatsApp.replace(/[^\d]/g, '')

      if (waNumber) {
        const summaryLines = selectedItems.map((item) => {
          const qty = quantities[item.id] || 0
          return `- ${item.name} x ${qty}`
        })

        const message = [
          `طلب متجر جديد من ${customerName.trim()}`,
          `الفرع: ${branchName}`,
          `الهاتف: ${phone.trim()}`,
          `رقم الطلب: ${orderId}`,
          `الإجمالي: ${total.toLocaleString('ar-EG')} ج.م`,
          'الأصناف:',
          ...summaryLines,
          notes.trim() ? `ملاحظات: ${notes.trim()}` : null,
        ]
          .filter(Boolean)
          .join('\n')

        const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
      }

      toast.success('تم إرسال الطلب بنجاح')
      setCustomerName('')
      setPhone('')
      setNotes('')
      setQuantities({})
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className='container mx-auto px-4 py-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>متجر المنتجات</h1>
          <p className='text-sm text-muted-foreground'>اطلب مستلزماتك مباشرة من الفرع المناسب</p>
        </div>
        <Link
          href={`/${tenantSlug}`}
          className='h-10 px-4 rounded-md border border-input text-sm inline-flex items-center'
        >
          الرجوع للرئيسية
        </Link>
      </div>

      {branches.length > 0 && (
        <Card className='rounded-2xl border-border/50 p-4'>
          <div className='space-y-2 max-w-sm'>
            <Label>اختر الفرع</Label>
            <Select
              value={effectiveBranchId}
              onValueChange={(value) => {
                setSelectedBranchId(value)
                setQuantities({})
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder='اختر الفرع' />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}

      {isLoading ? (
        <Card className='rounded-2xl p-8 text-center text-muted-foreground'>جاري تحميل المنتجات...</Card>
      ) : items.length === 0 ? (
        <Card className='rounded-2xl p-8 text-center text-muted-foreground'>
          لا توجد منتجات متاحة حالياً.
        </Card>
      ) : (
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
          <div className='xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3'>
            {items.map((item) => (
              <Card key={item.id} className='rounded-2xl border-border/50 p-4 space-y-3'>
                <div>
                  <p className='font-bold'>{item.name}</p>
                  <p className='text-sm text-muted-foreground line-clamp-2'>
                    {item.description || 'بدون وصف'}
                  </p>
                </div>

                <div className='text-sm'>
                  <p>السعر: {item.salePrice.toLocaleString('ar-EG')} ج.م</p>
                  <p className='text-muted-foreground'>المتوفر: {item.quantityOnHand}</p>
                </div>

                <div className='space-y-2'>
                  <Label>الكمية</Label>
                  <Input
                    type='number'
                    min='0'
                    value={quantities[item.id] || 0}
                    onChange={(event) => updateQuantity(item, event.target.value)}
                  />
                </div>
              </Card>
            ))}
          </div>

          <Card className='rounded-2xl border-border/50 p-4 h-fit'>
            <form onSubmit={submitOrder} className='space-y-3'>
              <h3 className='font-bold'>تأكيد الطلب</h3>

              <div className='space-y-2'>
                <Label>الاسم</Label>
                <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
              </div>

              <div className='space-y-2'>
                <Label>الهاتف</Label>
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
              </div>

              <div className='space-y-2'>
                <Label>ملاحظات</Label>
                <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>

              <div className='rounded-lg bg-muted/20 p-3 text-sm'>
                إجمالي الطلب: <span className='font-bold'>{total.toLocaleString('ar-EG')} ج.م</span>
              </div>

              <Button type='submit' disabled={isSubmitting || selectedItems.length === 0} className='w-full'>
                إرسال الطلب
              </Button>
            </form>
          </Card>
        </div>
      )}
    </main>
  )
}

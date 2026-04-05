'use client'

import {
  createInventoryItemAction,
  listInventoryItemsAction,
  setInventoryItemActivationAction,
  updateInventoryItemAction,
} from '@/actions/inventory/items'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { IInventoryItem, IInventoryItemPayload, InventoryItemType } from '@/types/inventory'
import { Search } from 'lucide-react'
import { useParams } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

const ITEM_TYPES: InventoryItemType[] = ['Medicine', 'Tool', 'Equipment', 'Consumable']

function statusColor(active: boolean): 'default' | 'outline' {
  return active ? 'default' : 'outline'
}

export default function InventoryPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const {
    data: itemsRes,
    isLoading,
    mutate,
  } = useSWR(['inventory-items', tenantSlug, search], () =>
    listInventoryItemsAction(tenantSlug, {
      search: search || undefined,
      pageNumber: 1,
      pageSize: 100,
      activeOnly: false,
    }),
  )

  const items = useMemo(() => itemsRes?.data?.items ?? [], [itemsRes?.data?.items])

  const defaultBranchId = useMemo(() => items[0]?.branchId || '', [items])

  const [form, setForm] = useState<IInventoryItemPayload>({
    name: '',
    description: '',
    skuCode: '',
    itemType: 'Consumable',
    unit: 'unit',
    salePrice: 0,
    costPrice: 0,
    quantityOnHand: 0,
    lowStockThreshold: 0,
    usableInVisit: true,
    sellablePublicly: false,
    internalOnly: false,
    billableInVisit: false,
    active: true,
    branchId: '',
    showInLanding: false,
    images: [],
  })

  const resetForm = () => {
    setEditingId(null)
    setForm((current) => ({
      ...current,
      name: '',
      description: '',
      skuCode: '',
      itemType: 'Consumable',
      unit: 'unit',
      salePrice: 0,
      costPrice: 0,
      quantityOnHand: 0,
      lowStockThreshold: 0,
      usableInVisit: true,
      sellablePublicly: false,
      internalOnly: false,
      billableInVisit: false,
      active: true,
      branchId: defaultBranchId,
      showInLanding: false,
      images: [],
    }))
  }

  const hydrateFormFromItem = (item: IInventoryItem) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      description: item.description || '',
      skuCode: item.skuCode,
      itemType: item.itemType,
      unit: item.unit,
      salePrice: item.salePrice,
      costPrice: item.costPrice,
      quantityOnHand: item.quantityOnHand,
      lowStockThreshold: item.lowStockThreshold,
      usableInVisit: item.usableInVisit,
      sellablePublicly: item.sellablePublicly,
      internalOnly: item.internalOnly,
      billableInVisit: item.billableInVisit,
      active: item.active,
      branchId: item.branchId,
      showInLanding: item.showInLanding,
      images: item.images.map((image) => image.imageUrl),
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.name.trim() || !form.skuCode.trim() || !form.unit.trim()) {
      toast.error('الاسم والـ SKU والوحدة حقول مطلوبة')
      return
    }

    if (!form.branchId.trim()) {
      toast.error('رقم الفرع مطلوب قبل الحفظ')
      return
    }

    setIsSaving(true)
    try {
      const payload: IInventoryItemPayload = {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        skuCode: form.skuCode.trim(),
        unit: form.unit.trim(),
      }

      const response = editingId
        ? await updateInventoryItemAction(tenantSlug, editingId, payload)
        : await createInventoryItemAction(tenantSlug, payload)

      if (!response.success) {
        toast.error(response.message || 'فشل حفظ الصنف')
        return
      }

      toast.success(editingId ? 'تم تعديل الصنف بنجاح' : 'تم إنشاء الصنف بنجاح')
      resetForm()
      await mutate()
    } finally {
      setIsSaving(false)
    }
  }

  const toggleActivation = async (item: IInventoryItem) => {
    const response = await setInventoryItemActivationAction(tenantSlug, item.id, !item.active)
    if (!response.success) {
      toast.error(response.message || 'فشل تحديث حالة التفعيل')
      return
    }

    toast.success(item.active ? 'تم إيقاف الصنف' : 'تم تفعيل الصنف')
    await mutate()
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading='المخزون'
        text='إدارة أصناف المخزون: إنشاء، تعديل، تفعيل، ومتابعة النواقص'
      />

      <Card className='rounded-2xl border-border/50 p-4'>
        <form onSubmit={handleSubmit} className='space-y-3'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            <div className='space-y-2'>
              <Label>اسم الصنف</Label>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder='مثال: Ibuprofen 400mg'
              />
            </div>

            <div className='space-y-2'>
              <Label>SKU</Label>
              <Input
                value={form.skuCode}
                onChange={(event) =>
                  setForm((current) => ({ ...current, skuCode: event.target.value }))
                }
                placeholder='MED-001'
              />
            </div>

            <div className='space-y-2'>
              <Label>نوع الصنف</Label>
              <select
                className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
                value={form.itemType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    itemType: event.target.value as InventoryItemType,
                  }))
                }
              >
                {ITEM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-2'>
              <Label>الوحدة</Label>
              <Input
                value={form.unit}
                onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
                placeholder='box / pcs / bottle'
              />
            </div>

            <div className='space-y-2'>
              <Label>سعر البيع</Label>
              <Input
                type='number'
                value={form.salePrice}
                onChange={(event) =>
                  setForm((current) => ({ ...current, salePrice: Number(event.target.value) || 0 }))
                }
              />
            </div>

            <div className='space-y-2'>
              <Label>سعر التكلفة</Label>
              <Input
                type='number'
                value={form.costPrice}
                onChange={(event) =>
                  setForm((current) => ({ ...current, costPrice: Number(event.target.value) || 0 }))
                }
              />
            </div>

            <div className='space-y-2'>
              <Label>الكمية المتاحة</Label>
              <Input
                type='number'
                value={form.quantityOnHand}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    quantityOnHand: Number(event.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className='space-y-2'>
              <Label>حد التنبيه</Label>
              <Input
                type='number'
                value={form.lowStockThreshold}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    lowStockThreshold: Number(event.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className='space-y-2 md:col-span-2'>
              <Label>Branch Id</Label>
              <Input
                value={form.branchId || defaultBranchId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, branchId: event.target.value }))
                }
                placeholder='GUID للفرع'
              />
            </div>

            <div className='space-y-2 md:col-span-2'>
              <Label>الوصف (اختياري)</Label>
              <Input
                value={form.description || ''}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>
          </div>

          <div className='flex flex-wrap gap-3 text-sm'>
            <label className='inline-flex items-center gap-2'>
              <input
                type='checkbox'
                checked={form.usableInVisit}
                onChange={(event) =>
                  setForm((current) => ({ ...current, usableInVisit: event.target.checked }))
                }
              />
              قابل للاستخدام في الزيارة
            </label>
            <label className='inline-flex items-center gap-2'>
              <input
                type='checkbox'
                checked={form.sellablePublicly}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sellablePublicly: event.target.checked }))
                }
              />
              قابل للبيع العام
            </label>
            <label className='inline-flex items-center gap-2'>
              <input
                type='checkbox'
                checked={form.billableInVisit}
                onChange={(event) =>
                  setForm((current) => ({ ...current, billableInVisit: event.target.checked }))
                }
              />
              مفوتر داخل الزيارة
            </label>
            <label className='inline-flex items-center gap-2'>
              <input
                type='checkbox'
                checked={form.showInLanding}
                onChange={(event) =>
                  setForm((current) => ({ ...current, showInLanding: event.target.checked }))
                }
              />
              ظاهر في صفحة الهبوط
            </label>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Button type='submit' disabled={isSaving}>
              {editingId ? 'حفظ التعديلات' : 'إضافة صنف'}
            </Button>
            {editingId && (
              <Button type='button' variant='outline' onClick={resetForm}>
                إلغاء التعديل
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className='rounded-2xl border-border/50 p-4 space-y-3'>
        <div className='flex items-center gap-2'>
          <Search className='w-4 h-4 text-muted-foreground' />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='ابحث بالاسم أو SKU'
          />
        </div>

        {isLoading ? (
          <div className='space-y-2'>
            <Skeleton className='h-16 w-full rounded-xl' />
            <Skeleton className='h-16 w-full rounded-xl' />
          </div>
        ) : items.length === 0 ? (
          <div className='rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground'>
            لا توجد أصناف في المخزون حالياً.
          </div>
        ) : (
          <div className='space-y-2'>
            {items.map((item) => (
              <div
                key={item.id}
                className='rounded-xl border border-border/50 p-3 flex flex-col md:flex-row md:items-center justify-between gap-3'
              >
                <div>
                  <div className='flex items-center gap-2'>
                    <p className='text-sm font-bold'>{item.name}</p>
                    <Badge variant={statusColor(item.active)}>{item.active ? 'نشط' : 'موقوف'}</Badge>
                    {item.isLowStock && <Badge variant='destructive'>مخزون منخفض</Badge>}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    SKU: {item.skuCode} • الكمية: {item.quantityOnHand} {item.unit} • الفرع:{' '}
                    {item.branchName}
                  </p>
                </div>

                <div className='flex flex-wrap gap-2'>
                  <Button variant='outline' size='sm' onClick={() => hydrateFormFromItem(item)}>
                    تعديل
                  </Button>
                  <Button variant='secondary' size='sm' onClick={() => void toggleActivation(item)}>
                    {item.active ? 'إيقاف' : 'تفعيل'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardShell>
  )
}

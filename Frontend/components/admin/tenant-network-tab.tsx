'use client'

import {
  getTenantNetworkLinksAction,
  linkTenantNetworkAction,
  unlinkTenantNetworkAction,
} from '@/actions/platform/tenant-network-actions'
import { getTenants } from '@/actions/platform/get-tenants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  ICreateTenantNetworkLinkRequest,
  ITenant,
  ITenantNetworkLink,
  TenantPartnerCategory,
} from '@/types/platform'
import { Link2, Loader2, RefreshCw, Unlink2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

const PARTNER_CATEGORY_LABELS: Record<TenantPartnerCategory, string> = {
  Laboratory: 'معمل',
  Radiology: 'أشعة',
  Pharmacy: 'صيدلية',
}

function getCounterpartType(tenantType: ITenant['tenantType']): ITenant['tenantType'] {
  return tenantType === 'Clinic' ? 'Partner' : 'Clinic'
}

export function TenantNetworkTab({ tenant }: { tenant: ITenant }) {
  const [links, setLinks] = useState<ITenantNetworkLink[]>([])
  const [tenants, setTenants] = useState<ITenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const [linkedTenantId, setLinkedTenantId] = useState('')
  const [partnerType, setPartnerType] = useState<TenantPartnerCategory>(
    tenant.partnerCategory ?? 'Laboratory',
  )
  const [notes, setNotes] = useState('')

  const counterpartType = getCounterpartType(tenant.tenantType)

  const getLinkedTenantId = useCallback(
    (link: ITenantNetworkLink) =>
      tenant.tenantType === 'Clinic' ? link.partnerTenantId : link.clinicTenantId,
    [tenant.tenantType],
  )

  const getLinkedTenantName = useCallback(
    (link: ITenantNetworkLink) =>
      tenant.tenantType === 'Clinic' ? link.partnerTenantName : link.clinicTenantName,
    [tenant.tenantType],
  )

  const linkedTenantIds = useMemo(
    () => new Set(links.filter((link) => link.isActive).map(getLinkedTenantId)),
    [getLinkedTenantId, links],
  )

  const candidateTenants = useMemo(() => {
    return tenants
      .filter(
        (candidate) =>
          candidate.id !== tenant.id &&
          candidate.tenantType === counterpartType &&
          candidate.status === 'Active' &&
          !linkedTenantIds.has(candidate.id),
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
  }, [counterpartType, linkedTenantIds, tenant.id, tenants])

  const fetchData = useCallback(async () => {
    const [networkResponse, tenantsResponse] = await Promise.all([
      getTenantNetworkLinksAction(tenant.id),
      getTenants(),
    ])

    return {
      networkResponse,
      tenantsResponse,
      networkLinks: networkResponse.data ?? [],
      tenantItems: tenantsResponse.data?.items ?? [],
    }
  }, [tenant.id])

  async function refreshData() {
    setIsLoading(true)
    const { networkResponse, tenantsResponse, networkLinks, tenantItems } = await fetchData()

    if (!networkResponse.success) {
      toast.error(networkResponse.message || 'فشل تحميل روابط الشبكة')
    }

    if (!tenantsResponse.success) {
      toast.error(tenantsResponse.message || 'فشل تحميل قائمة المنشآت')
    }

    setLinks(networkLinks)
    setTenants(tenantItems)
    setIsLoading(false)
  }

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      const { networkResponse, tenantsResponse, networkLinks, tenantItems } = await fetchData()

      if (!networkResponse.success) {
        toast.error(networkResponse.message || 'فشل تحميل روابط الشبكة')
      }

      if (!tenantsResponse.success) {
        toast.error(tenantsResponse.message || 'فشل تحميل قائمة المنشآت')
      }

      setLinks(networkLinks)
      setTenants(tenantItems)
      setIsLoading(false)
    }

    void load()
  }, [fetchData])

  const handleLinkedTenantChange = (value: string) => {
    setLinkedTenantId(value)

    const selectedTenant = candidateTenants.find((candidate) => candidate.id === value)
    if (selectedTenant?.partnerCategory) {
      setPartnerType(selectedTenant.partnerCategory)
    }
  }

  const handleLink = () => {
    if (!linkedTenantId) {
      toast.error('اختر المنشأة المراد ربطها أولاً')
      return
    }

    const payload: ICreateTenantNetworkLinkRequest = {
      linkedTenantId,
      partnerType,
      notes: notes.trim() ? notes.trim() : undefined,
    }

    startTransition(async () => {
      const response = await linkTenantNetworkAction(tenant.id, payload)
      if (!response.success) {
        toast.error(response.message || 'فشل إنشاء الرابط')
        return
      }

      toast.success('تم ربط المنشأتين بنجاح')
      setLinkedTenantId('')
      setNotes('')
      await refreshData()
    })
  }

  const handleUnlink = (linkId: string) => {
    startTransition(async () => {
      const response = await unlinkTenantNetworkAction(linkId)
      if (!response.success) {
        toast.error(response.message || 'تعذر فك الربط')
        return
      }

      toast.success('تم فك الربط بنجاح')
      await refreshData()
    })
  }

  if (isLoading) {
    return (
      <div className='flex min-h-75 items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    )
  }

  return (
    <div className='space-y-6 py-4'>
      <div className='rounded-xl border bg-muted/20 p-4'>
        <div className='mb-2 flex items-center justify-between'>
          <h4 className='text-sm font-bold'>ربط منشأة جديدة بالشبكة</h4>
          <Button
            variant='ghost'
            size='sm'
            className='h-8 gap-2'
            onClick={refreshData}
            disabled={isPending}
          >
            <RefreshCw className='h-3.5 w-3.5' />
            تحديث
          </Button>
        </div>
        <p className='text-xs text-muted-foreground'>
          الربط مسموح مع نوع: {counterpartType === 'Clinic' ? 'عيادات' : 'شركاء'} فقط.
        </p>

        <div className='mt-4 grid gap-4'>
          <div className='grid gap-2'>
            <Label>المنشأة المراد ربطها</Label>
            <Select value={linkedTenantId} onValueChange={handleLinkedTenantChange}>
              <SelectTrigger>
                <SelectValue placeholder='اختر منشأة' />
              </SelectTrigger>
              <SelectContent>
                {candidateTenants.length === 0 ? (
                  <SelectItem value='__none__' disabled>
                    لا توجد منشآت متاحة للربط
                  </SelectItem>
                ) : (
                  candidateTenants.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className='grid gap-2 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label>نوع الشريك</Label>
              <Select
                value={partnerType}
                onValueChange={(value) => setPartnerType(value as TenantPartnerCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='اختر نوع الشريك' />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PARTNER_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-2'>
              <Label>ملاحظات (اختياري)</Label>
              <Input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder='مثال: إحالات التحاليل فقط'
              />
            </div>
          </div>

          <Button onClick={handleLink} disabled={isPending || !linkedTenantId} className='gap-2'>
            {isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Link2 className='h-4 w-4' />}
            ربط بالشبكة
          </Button>
        </div>
      </div>

      <div className='space-y-3'>
        <h4 className='text-sm font-bold'>الروابط الحالية</h4>

        {links.length === 0 ? (
          <div className='rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground'>
            لا توجد روابط شبكة حالياً لهذه المنشأة.
          </div>
        ) : (
          <div className='space-y-2'>
            {links.map((link) => (
              <div
                key={link.id}
                className='flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between'
              >
                <div className='space-y-1'>
                  <p className='font-semibold'>{getLinkedTenantName(link)}</p>
                  <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                    <Badge variant='outline'>{PARTNER_CATEGORY_LABELS[link.partnerType]}</Badge>
                    <Badge
                      variant='secondary'
                      className={cn(
                        link.isActive
                          ? 'bg-emerald-500/10 text-emerald-700'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {link.isActive ? 'نشط' : 'موقوف'}
                    </Badge>
                  </div>
                  {link.notes ? <p className='text-xs text-muted-foreground'>{link.notes}</p> : null}
                </div>

                <Button
                  variant='outline'
                  size='sm'
                  className='gap-2 text-destructive hover:text-destructive'
                  onClick={() => handleUnlink(link.id)}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Unlink2 className='h-4 w-4' />
                  )}
                  فك الربط
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ITenant } from '@/types/platform'
import { TenantFlagsForm } from './tenant-flags-form'
import { getTenantFlags } from '@/actions/platform/feature-flags'
import { Loader2 } from 'lucide-react'
import { IFeatureFlags } from '../../types/feature-flags'
import { TenantSubscriptionTab } from './tenant-subscription-tab'
import { TenantNetworkTab } from './tenant-network-tab'
import { Button } from '../ui/button'

interface ManageTenantSheetProps {
  tenant: ITenant | null
  isOpen: boolean
  onClose: () => void
}

export function ManageTenantSheet({ tenant, isOpen, onClose }: ManageTenantSheetProps) {
  const [flags, setFlags] = useState<IFeatureFlags | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [flagsError, setFlagsError] = useState<string | null>(null)

  const fetchFlags = async (tenantId: string) => {
    setIsLoading(true)
    setFlagsError(null)

    const res = await getTenantFlags(tenantId)
    if (res.success && res.data) {
      setFlags(res.data)
      setIsLoading(false)
      return
    }

    setFlags(null)
    setFlagsError(res.message || 'فشل في تحميل الخواص')
    setIsLoading(false)
  }

  // أول ما الـ Sheet يفتح، بنروح نجيب الـ Flags بتاعة العيادة دي
  useEffect(() => {
    if (!isOpen || !tenant?.id) return

    setFlags(null)
    void fetchFlags(tenant.id)
  }, [isOpen, tenant?.id])

  if (!tenant) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className='sm:max-w-125 overflow-y-auto' dir='rtl'>
        <SheetHeader className='text-right'>
          <SheetTitle>إدارة منشأة: {tenant.name}</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue='flags' className='mt-6'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='flags'>الخواص</TabsTrigger>
            <TabsTrigger value='subscription'>الاشتراك</TabsTrigger>
            <TabsTrigger value='network'>شبكة الشركاء</TabsTrigger>
          </TabsList>

          <TabsContent value='flags' className='min-h-75 flex flex-col'>
            {isLoading ? (
              <div className='flex-1 flex items-center justify-center'>
                <Loader2 className='h-8 w-8 animate-spin text-primary' />
              </div>
            ) : flags ? (
              // هنا بنمرر الـ initialData اللي كانت ناقصة
              <TenantFlagsForm tenantId={tenant.id} initialData={flags} />
            ) : (
              <div className='flex-1 flex flex-col items-center justify-center gap-3 py-10 text-center'>
                <p className='text-sm text-muted-foreground'>
                  {flagsError || 'فشل في تحميل الخواص'}
                </p>
                <Button variant='outline' size='sm' onClick={() => void fetchFlags(tenant.id)}>
                  إعادة المحاولة
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value='subscription'>
              <TenantSubscriptionTab tenantId={tenant.id} />
          </TabsContent>

          <TabsContent value='network'>
            <TenantNetworkTab key={tenant.id} tenant={tenant} />
          </TabsContent>

        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

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

interface ManageTenantSheetProps {
  tenant: ITenant | null
  isOpen: boolean
  onClose: () => void
}

export function ManageTenantSheet({ tenant, isOpen, onClose }: ManageTenantSheetProps) {
  const [flags, setFlags] = useState<IFeatureFlags | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // أول ما الـ Sheet يفتح، بنروح نجيب الـ Flags بتاعة العيادة دي
  useEffect(() => {
    if (isOpen && tenant?.id) {
      const fetchFlags = async () => {
        setIsLoading(true)
        const res = await getTenantFlags(tenant.id)
        if (res.success && res.data) {
          setFlags(res.data)
        }
        setIsLoading(false)
      }
      fetchFlags()
    }
  }, [isOpen, tenant?.id])

  if (!tenant) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className='sm:max-w-125 overflow-y-auto' dir='rtl'>
        <SheetHeader className='text-right'>
          <SheetTitle>إدارة عيادة: {tenant.name}</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue='flags' className='mt-6'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='flags'>الخواص</TabsTrigger>
            <TabsTrigger value='subscription'>الاشتراك</TabsTrigger>
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
              <p className='text-center py-10 text-muted-foreground'>فشل في تحميل الخواص</p>
            )}
          </TabsContent>

          <TabsContent value='subscription'>
              <TenantSubscriptionTab tenantId={tenant.id} />
          </TabsContent>

        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

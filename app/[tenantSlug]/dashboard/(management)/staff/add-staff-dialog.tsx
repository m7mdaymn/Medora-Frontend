'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import { CreatePayrollWorkerForm } from './create-payroll-worker-form'
import { CreateStaffForm } from './create-staff-form'

interface Props {
  tenantSlug: string
}

export function AddStaffDialog({ tenantSlug }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          موظف جديد
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-150 max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>إضافة موظف جديد</DialogTitle>
          <DialogDescription>
            اختر إذا كان العامل يحتاج حساب دخول أو إضافته كعامل رواتب فقط.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue='with-account' dir='rtl' className='space-y-4'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='with-account'>بحساب دخول</TabsTrigger>
            <TabsTrigger value='payroll-only'>بدون حساب</TabsTrigger>
          </TabsList>

          <TabsContent value='with-account' className='mt-0'>
            <CreateStaffForm tenantSlug={tenantSlug} onSuccess={() => setOpen(false)} />
          </TabsContent>

          <TabsContent value='payroll-only' className='mt-0'>
            <CreatePayrollWorkerForm tenantSlug={tenantSlug} onSuccess={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

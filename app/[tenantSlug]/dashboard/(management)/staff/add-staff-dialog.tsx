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
import { Plus } from 'lucide-react'
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
          <DialogDescription>بيانات الدخول وصلاحيات الموظف على السيستم.</DialogDescription>
        </DialogHeader>

        <CreateStaffForm tenantSlug={tenantSlug} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

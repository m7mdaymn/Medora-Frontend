'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Edit, MoreHorizontal } from 'lucide-react'
import { useParams } from 'next/navigation' // عشان نجيب الـ tenantSlug
import { useState } from 'react'
import { IStaff } from '../../../../../types/staff'
import { UpdateStaffDialog } from './update-staff-dialog'

export function StaffActionsCell({ staff }: { staff: IStaff }) {
  const [openUpdate, setOpenUpdate] = useState(false)
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  return (
    <>
      <UpdateStaffDialog
        staff={staff}
        tenantSlug={tenantSlug}
        open={openUpdate}
        onOpenChange={setOpenUpdate}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>

          {/* بنفتح المودال لما يدوس تعديل */}
          <DropdownMenuItem onClick={() => setOpenUpdate(true)}>
            <Edit className='ml-2 h-4 w-4' /> تعديل
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

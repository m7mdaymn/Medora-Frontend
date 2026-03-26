'use client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Settings2, Power, PowerOff, Loader2, Edit } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { VisitFieldsConfigModal } from './visit-fields-modal'
import { IDoctor } from '../../../../../types/doctor'
import { toggleDoctorStatusAction } from '@/actions/doctor/toggle-doctor-status'
import { toast } from 'sonner'
import { EditDoctorDialog } from './edit-doctor-dialog' // <-- تأكد من المسار ده عندك

export const DoctorActionsCell = ({ doctor }: { doctor: IDoctor }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false) // <-- 1. ستيت جديدة للتعديل
  const [isPending, startTransition] = useTransition()

  const params = useParams<{ tenantSlug: string }>()
  const tenantSlug = params?.tenantSlug || ''

  const handleToggleStatus = () => {
    startTransition(async () => {
      const result = await toggleDoctorStatusAction(doctor.id, tenantSlug, doctor.isEnabled)

      if (result.success) {
        toast.success(doctor.isEnabled ? 'تم إيقاف حساب الطبيب' : 'تم تفعيل حساب الطبيب')
      } else {
        toast.error('حدث خطأ أثناء تغيير الحالة')
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0' disabled={isPending}>
            <span className='sr-only'>Open menu</span>
            {isPending ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <MoreHorizontal className='h-4 w-4' />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => setIsModalOpen(true)} disabled={!doctor.isEnabled}>
            <Settings2 className='w-4 h-4 ml-1' /> تخصيص العلامات الحيوية
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* 2. فتح مودال التعديل */}
          <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
            <Edit className='w-4 h-4 ml-1' />
            تعديل البيانات
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleToggleStatus}
            className={
              doctor.isEnabled
                ? 'text-destructive focus:bg-destructive/10 focus:text-destructive'
                : 'text-green-600 focus:text-green-600 focus:bg-green-100/10'
            }
          >
            {doctor.isEnabled ? (
              <>
                <PowerOff className='w-4 h-4 ml-2' /> إيقاف الحساب
              </>
            ) : (
              <>
                <Power className='w-4 h-4 ml-2' /> تفعيل الحساب
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* مودال العلامات الحيوية */}
      {isModalOpen && (
        <VisitFieldsConfigModal
          tenantSlug={tenantSlug}
          doctorId={doctor.id}
          initialConfig={doctor.visitFieldConfig}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* 3. مودال تعديل البيانات */}
      {isEditModalOpen && (
        <EditDoctorDialog
          doctor={doctor}
          tenantSlug={tenantSlug}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  )
}

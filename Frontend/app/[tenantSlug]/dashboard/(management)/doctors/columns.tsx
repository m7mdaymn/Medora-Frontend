'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Clock, Phone, Stethoscope } from 'lucide-react'
import { IDoctor } from '../../../../../types/doctor'
import { DoctorActionsCell } from './doctor-actions-cell'
import { ClinicImage } from '@/components/shared/clinic-image' // 👈 الـ Component السحري

export const columns: ColumnDef<IDoctor>[] = [
  {
    accessorKey: 'name',
    header: 'الطبيب',
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      const doctor = row.original

      return (
        <div
          className={`flex items-center gap-3 transition-opacity ${
            doctor.isEnabled ? 'opacity-100' : 'opacity-50'
          }`}
        >
          {/* 1. تنظيف شامل لمنطقة الصورة */}
          <div className='relative h-9 w-9 shrink-0 overflow-hidden rounded-full border bg-muted'>
            <ClinicImage
              src={doctor.photoUrl}
              alt={name}
              fill
              fallbackType='doctor' // عشان لو مفيش صورة تطلع أيقونة الدكتور فوراً
              className='object-cover'
            />
          </div>

          <div className='flex flex-col'>
            <span className='font-medium text-sm'>{name}</span>
            <span className='text-xs text-muted-foreground'>{doctor.username}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'specialty',
    header: 'التخصص',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <Stethoscope className='w-4 h-4 text-primary/70' />
        <span className='text-sm'>{row.getValue('specialty')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'phone',
    header: 'الهاتف',
    cell: ({ row }) => (
      <div className='flex items-center gap-2 text-sm'>
        <Phone className='w-4 h-4 text-primary/70' />
        <span dir='ltr'>{row.getValue('phone') || '-'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'avgVisitDurationMinutes',
    header: 'مدة الكشف',
    cell: ({ row }) => (
      <div className='flex items-center gap-2 text-sm font-medium'>
        <Clock className='w-4 h-4 text-primary/70' />
        <span>{row.getValue('avgVisitDurationMinutes')} دقيقة</span>
      </div>
    ),
  },
  {
    accessorKey: 'isEnabled',
    header: 'الحالة',
    cell: ({ getValue }) => {
      const isEnabled = getValue() as boolean
      return (
        <div className='flex items-center gap-2'>
          <span
            className={`h-2 w-2 rounded-full ${
              isEnabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-destructive'
            }`}
          />
          <span className='text-xs font-medium'>{isEnabled ? 'نشط' : 'معطل'}</span>
        </div>
      )
    },
  },
  {
    id: 'actions',
    header: 'الإجراءات',
    cell: ({ row }) => <DoctorActionsCell doctor={row.original} />,
  },
]

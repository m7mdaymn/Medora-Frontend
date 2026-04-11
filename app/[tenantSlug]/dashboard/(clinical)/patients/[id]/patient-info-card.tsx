'use client'

import { Card, CardHeader } from '@/components/ui/card'
import { IPatient } from '@/types/patient'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Calendar, MapPin, Phone, User as UserIcon } from 'lucide-react'
import { calculateAge } from '../../../../../../lib/patient-utils'

export function PatientInfoCard({ patient }: { patient: IPatient }) {
  return (
    <Card className='overflow-hidden  '>
      <CardHeader>
        <h2 className='text-xl font-bold tracking-tight text-foreground leading-none'>
          {patient.name}
        </h2>
      </CardHeader>
      {/* 2. Data Rows: (Clean Text-First UI) */}
      <div className='p-0 flex flex-col'>
        {/* الصف الأول: العمر والنوع */}
        <div className='flex items-center justify-between p-4 border-b border-border/30 hover:bg-muted/5 transition-colors'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <UserIcon className='size-4' />
            <span className='text-xs font-medium'>العمر والنوع</span>
          </div>
          <span className='text-sm font-semibold text-foreground'>
            {calculateAge(patient.dateOfBirth)} سنة • {patient.gender === 'Male' ? 'ذكر' : 'أنثى'}
          </span>
        </div>

        {/* الصف الثاني: التليفون */}
        <div className='flex items-center justify-between p-4 border-b border-border/30 hover:bg-muted/5 transition-colors'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <Phone className='size-4' />
            <span className='text-xs font-medium'>رقم الهاتف</span>
          </div>
          <span className='text-sm font-bold font-mono tracking-wide text-foreground' dir='ltr'>
            {patient.phone}
          </span>
        </div>

        {/* الصف الثالث: تاريخ الانضمام */}
        <div className='flex items-center justify-between p-4 border-b border-border/30 hover:bg-muted/5 transition-colors'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <Calendar className='size-4' />
            <span className='text-xs font-medium'>تاريخ الانضمام</span>
          </div>
          <span className='text-sm font-semibold text-foreground'>
            {format(new Date(patient.createdAt), 'dd MMM yyyy', { locale: ar })}
          </span>
        </div>

        {/* الصف الرابع: العنوان (بيأخد السطر كله لو طويل) */}
        {patient.address && (
          <div className='flex flex-col gap-2 p-4 hover:bg-muted/5 transition-colors'>
            <div className='flex items-center gap-2 text-muted-foreground'>
              <MapPin className='size-4' />
              <span className='text-xs font-medium'>العنوان بالتفصيل</span>
            </div>
            <span className='text-sm font-medium text-foreground leading-relaxed'>
              {patient.address}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}

'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { IPatient } from '@/types/patient'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Calendar, MapPin, Phone } from 'lucide-react'

interface PatientInfoCardProps {
  patient: IPatient
}

export function PatientInfoCard({ patient }: PatientInfoCardProps) {
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <Card className='border-border/50 shadow-sm overflow-hidden  p-0'>
      <CardContent className='p-0'>
        {/* الجزء العلوي: الصورة والاسم (Compact Layout) */}
        <div className='p-5 md:p-6 flex flex-col md:flex-row items-center md:items-start gap-4 border-b border-border/50 relative bg-muted/10'>
          <div className='absolute top-4 right-4 md:right-auto md:left-4'>
            <Badge
              variant={patient.isDefault ? 'default' : 'secondary'}
              className='shadow-none text-[10px] h-5'
            >
              {patient.isDefault ? 'رئيسي' : 'فرعي'}
            </Badge>
          </div>

          <div className='w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-black ring-4 ring-background shadow-sm'>
            {patient.name.charAt(0)}
          </div>

          <div className='text-center md:text-start flex-1 w-full pt-2'>
            <h2 className='text-xl md:text-2xl font-bold text-foreground mb-1'>{patient.name}</h2>

            {/* Quick Actions للموبايل والديسكتوب */}
            <div className='flex items-center justify-center md:justify-start gap-2 w-full'>
              <div className='flex space-x-2'>
                <Phone className='w-3 h-3' />
                <span className='text-xs' dir='ltr'>
                  {patient.phone}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* الجزء السفلي: الداتا الأساسية في Grid صغير مش سطور طويلة */}
        <div className='p-4 md:p-6 bg-card'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <span className='text-[10px] text-muted-foreground font-bold uppercase mb-1  flex items-center gap-1'>
                <Calendar className='w-3 h-3' /> العمر والنوع
              </span>
              <p className='text-sm font-semibold text-foreground'>
                {calculateAge(patient.dateOfBirth)} سنة •{' '}
                {patient.gender === 'Male' ? 'ذكر' : 'أنثى'}
              </p>
            </div>

            <div>
              <span className='text-[10px] text-muted-foreground font-bold uppercase mb-1 block'>
                تاريخ التسجيل
              </span>
              <p className='text-sm font-semibold text-foreground'>
                {format(new Date(patient.createdAt), 'dd MMM yyyy', { locale: ar })}
              </p>
            </div>

            {patient.address && (
              <div className='col-span-2 pt-2 border-t border-border/50'>
                <span className='text-[10px] text-muted-foreground font-bold uppercase mb-1 flex items-center gap-1 '>
                  <MapPin className='w-3 h-3' /> العنوان
                </span>
                <p className='text-sm font-medium text-foreground leading-relaxed'>
                  {patient.address}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

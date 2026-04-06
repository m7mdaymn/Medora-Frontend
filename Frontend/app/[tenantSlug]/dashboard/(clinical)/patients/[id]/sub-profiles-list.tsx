'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Phone, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { ISubProfile } from '@/types/patient'

interface SubProfilesListProps {
  subProfiles: ISubProfile[]
}

export function SubProfilesList({ subProfiles }: SubProfilesListProps) {
  if (!subProfiles || subProfiles.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
          <User className='h-12 w-12 mb-3 opacity-50' />
          <p className='text-lg font-medium'>لا توجد ملفات فرعية</p>
          <p className='text-sm'>هذا المريض ليس لديه ملفات فرعية (أبناء/زوجة)</p>
        </CardContent>
      </Card>
    )
  }

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
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      {subProfiles.map((profile) => (
        <Card key={profile.id} className='p-0'>
          <CardContent className='p-4'>
            <div className='flex items-start justify-between mb-3'>
              <div className='flex items-center gap-2'>
                <div>
                  <p className='font-semibold'>{profile.name}</p>
                  {profile.isDefault && (
                    <Badge variant='secondary' className='text-xs'>
                      افتراضي
                    </Badge>
                  )}
                </div>
              </div>
              <Badge variant='outline'>{profile.gender === 'Male' ? 'ذكر' : 'أنثى'}</Badge>
            </div>

            <div className='space-y-2 text-sm'>
              <div className='flex items-center gap-2'>
                <Phone className='h-3 w-3 text-muted-foreground' />
                <span dir='ltr'>{profile.phone}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Calendar className='h-3 w-3 text-muted-foreground' />
                <span>
                  {format(new Date(profile.dateOfBirth), 'PPP', { locale: ar })}
                  <span className='text-muted-foreground mr-1'>
                    ({calculateAge(profile.dateOfBirth)} سنة)
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IDoctor } from '@/types/doctor'

interface Props {
  doctors: IDoctor[]
  selectedId: string
  onSelect: (id: string) => void
}

export function DoctorSelect({ doctors, selectedId, onSelect }: Props) {
  // 1. تأمين الداتا ضد الـ Undefined
  const activeDoctors = doctors?.filter((doctor) => doctor.isEnabled) || []

  return (
    <div className='flex items-center gap-4 bg-muted/30 p-4 rounded-lg border'>
      <Label>اختر الطبيب لتعديل خدماته:</Label>

      {/* 2. تحويل السترينج الفاضي لـ undefined عشان الـ Placeholder يشتغل */}
      <Select value={selectedId || undefined} onValueChange={onSelect}>
        <SelectTrigger className='w-75 bg-background'>
          <SelectValue placeholder='اختر طبيب...' />
        </SelectTrigger>
        <SelectContent>
          {/* 3. التعامل مع حالة إن القائمة فاضية */}
          {activeDoctors.length > 0 ? (
            activeDoctors.map((doc) => (
              <SelectItem key={doc.id} value={doc.id}>
                {doc.name}
              </SelectItem>
            ))
          ) : (
            <div className='p-2 text-sm text-center text-muted-foreground'>
              لا يوجد أطباء متاحين
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

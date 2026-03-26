import { IPrescription } from '@/types/visit'
import { Pill } from 'lucide-react'

interface Props {
  prescriptions: IPrescription[]
}

export function VisitPrescriptions({ prescriptions }: Props) {
  if (!prescriptions?.length) return null

  return (
    <div className='space-y-3 pt-4 border-t'>
      <h4 className='flex items-center font-semibold gap-2 text-primary'>
        <Pill className='w-4 h-4' /> الأدوية الموصوفة (الروشتة)
      </h4>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
        {prescriptions.map((med) => (
          <div key={med.id} className='flex flex-col p-3 border rounded-md bg-muted/5'>
            <span className='font-bold text-sm'>{med.medicationName}</span>
            <span className='text-xs text-muted-foreground mt-1'>
              {med.dosage} - {med.frequency} ({med.duration})
            </span>
            {med.instructions && (
              <span className='text-xs text-muted-foreground mt-1 border-t pt-1'>
                {med.instructions}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

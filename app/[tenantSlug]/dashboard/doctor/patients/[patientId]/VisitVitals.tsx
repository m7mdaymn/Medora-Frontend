import { Badge } from '@/components/ui/badge'
import { IVisit } from '@/types/visit'
import { Activity } from 'lucide-react'

interface Props {
  visit: IVisit
}

export function VisitVitals({ visit }: Props) {
  const hasVitals =
    visit.bloodPressureSystolic ||
    visit.heartRate ||
    visit.temperature ||
    visit.weight ||
    visit.bloodSugar

  if (!hasVitals) return null

  return (
    <div className='space-y-3'>
      <h4 className='flex items-center font-semibold gap-2 text-muted-foreground'>
        <Activity className='w-4 h-4' /> العلامات الحيوية
      </h4>
      <div className='flex flex-wrap gap-2'>
        {visit.bloodPressureSystolic && visit.bloodPressureDiastolic && (
          <Badge variant='outline' className='bg-background px-3 py-1'>
            الضغط: {visit.bloodPressureSystolic}/{visit.bloodPressureDiastolic}
          </Badge>
        )}
        {visit.heartRate && (
          <Badge variant='outline' className='bg-background px-3 py-1'>
            النبض: {visit.heartRate} bpm
          </Badge>
        )}
        {visit.temperature && (
          <Badge variant='outline' className='bg-background px-3 py-1'>
            الحرارة: {visit.temperature}°C
          </Badge>
        )}
        {visit.weight && (
          <Badge variant='outline' className='bg-background px-3 py-1'>
            الوزن: {visit.weight} kg
          </Badge>
        )}
        {visit.bloodSugar && (
          <Badge variant='outline' className='bg-background px-3 py-1'>
            السكر: {visit.bloodSugar} mg/dL
          </Badge>
        )}
      </div>
    </div>
  )
}

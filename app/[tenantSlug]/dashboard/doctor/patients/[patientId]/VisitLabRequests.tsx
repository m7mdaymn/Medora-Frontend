import { Badge } from '@/components/ui/badge'
import { ILabRequest } from '@/types/visit'
import { FlaskConical } from 'lucide-react'

interface Props {
  requests: ILabRequest[]
}

export function VisitLabRequests({ requests }: Props) {
  if (!requests?.length) return null

  return (
    <div className='space-y-3 pt-4 border-t'>
      <h4 className='flex items-center font-semibold gap-2 text-primary'>
        <FlaskConical className='w-4 h-4' /> التحاليل والأشعة المطلوبة
      </h4>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
        {requests.map((lab) => (
          <div
            key={lab.id}
            className='p-3 border rounded-md bg-muted/5 flex justify-between items-start'
          >
            <div>
              <span className='font-bold text-sm'>{lab.testName}</span>
              <Badge variant='secondary' className='mr-2 text-[10px]'>
                {lab.type === 'Lab' ? 'تحليل' : 'أشعة'}
              </Badge>
              {lab.notes && <p className='text-xs text-muted-foreground mt-1'>{lab.notes}</p>}
              {lab.resultText && (
                <p className='text-xs text-emerald-600 font-medium mt-2 bg-emerald-50 p-1 rounded'>
                  النتيجة: {lab.resultText}
                </p>
              )}
            </div>
            {lab.isUrgent && (
              <Badge variant='destructive' className='text-[10px]'>
                عاجل
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

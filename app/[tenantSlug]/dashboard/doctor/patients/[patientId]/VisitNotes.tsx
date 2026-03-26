import { FileText } from 'lucide-react'

interface Props {
  complaint?: string | null
  diagnosis?: string | null
  notes?: string | null
}

export function VisitNotes({ complaint, diagnosis, notes }: Props) {
  if (!complaint && !diagnosis && !notes) return null

  return (
    <div className='space-y-6'>
      {(complaint || diagnosis) && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-4 rounded-lg border border-border/50'>
          {complaint && (
            <div>
              <h4 className='font-semibold text-sm text-muted-foreground mb-1'>الشكوى الأساسية:</h4>
              <p className='text-sm leading-relaxed'>{complaint}</p>
            </div>
          )}
          {diagnosis && (
            <div>
              <h4 className='font-semibold text-sm text-muted-foreground mb-1'>التشخيص:</h4>
              <p className='text-sm leading-relaxed font-medium'>{diagnosis}</p>
            </div>
          )}
        </div>
      )}

      {notes && (
        <div className='space-y-2'>
          <h4 className='flex items-center font-semibold gap-2 text-muted-foreground'>
            <FileText className='w-4 h-4' /> الملاحظات الطبية
          </h4>
          <p className='text-sm bg-background p-3 rounded-md border'>{notes}</p>
        </div>
      )}
    </div>
  )
}

import { Card, CardContent } from '@/components/ui/card'
import { IVisit } from '@/types/visit'
import { VisitHeader } from './VisitHeader'
import { VisitLabRequests } from './VisitLabRequests'
import { VisitNotes } from './VisitNotes'
import { VisitPrescriptions } from './VisitPrescriptions'
import { VisitVitals } from './VisitVitals'

interface Props {
  visit: IVisit
}

export function VisitCard({ visit }: Props) {
  return (
    <Card className='mb-6 overflow-hidden border-border/50 shadow-sm p-0'>
      <VisitHeader startedAt={visit.startedAt} status={visit.status} />

      <CardContent className='p-6 space-y-6'>
        <VisitVitals visit={visit} />

        <VisitNotes complaint={visit.complaint} diagnosis={visit.diagnosis} notes={visit.notes} />

        <VisitPrescriptions prescriptions={visit.prescriptions} />

        <VisitLabRequests requests={visit.labRequests} />
      </CardContent>
    </Card>
  )
}

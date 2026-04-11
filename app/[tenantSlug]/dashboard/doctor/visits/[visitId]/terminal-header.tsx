'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { IVisit } from '@/types/visit'
import { AlertTriangle, CalendarDays, History, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useTenantStore } from '../../../../../../store/useTenantStore'

import { IPatientSummary } from '../../../../../../types/patient-app'
import { HistoryTab } from './history-tab'

// ============================================================================
// واجهة الهيدر الداخلي (بدون Gender)
// ============================================================================
interface TerminalHeaderProps {
  visit: IVisit
  isClosed: boolean
  patientAge: string | number
  chronicDiseases: string[]
  tenantSlug: string
  summary: IPatientSummary | null
  isCompleting: boolean
  onComplete: () => void
}

export function TerminalHeader({
  visit,
  isClosed,
  patientAge,
  chronicDiseases,
  tenantSlug,
  summary,
  isCompleting,
  onComplete,
}: TerminalHeaderProps) {
  const tenantConfig = useTenantStore((state) => state.config)

  const handlePrint = async () => {
    if (!tenantConfig?.logoUrl) {
      window.print()
      return
    }

    const toastId = toast.loading('جاري تجهيز الروشتة للطباعة...')
    try {
      await new Promise((resolve) => {
        const img = new Image()
        img.src = tenantConfig.logoUrl || ''
        img.onload = resolve
        img.onerror = resolve
      })
    } catch {
      console.error('Failed to preload logo')
    } finally {
      toast.dismiss(toastId)
      window.print()
    }
  }

  return (
    <div className='bg-card p-4 md:p-5 rounded-xl border shadow-sm flex flex-col lg:flex-row justify-between gap-4 md:gap-5 relative overflow-hidden'>
      {/* منطقة بيانات المريض (ريسبونسف) */}
      <div className='flex flex-col gap-2 md:gap-3 z-10 pl-0 md:pl-2'>
        <div className='flex flex-wrap items-center gap-2 md:gap-3'>
          <h2 className='text-xl sm:text-2xl font-black text-foreground leading-none'>
            {visit.patientName}
          </h2>

          <span className='flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded-md'>
            <CalendarDays className='w-3.5 h-3.5 md:w-4 md:h-4' /> {patientAge} سنة
          </span>

          {isClosed && (
            <Badge variant='secondary' className='whitespace-nowrap'>
              زيارة مكتملة
            </Badge>
          )}
        </div>

        {chronicDiseases.length > 0 && (
          <div className='flex flex-wrap items-center gap-1.5 md:gap-2 mt-1'>
            <span className='text-[11px] md:text-xs font-bold text-destructive flex items-center gap-1 shrink-0'>
              <AlertTriangle className='w-3.5 h-3.5' /> تحذير طبي:
            </span>
            {chronicDiseases.map((disease: string, idx: number) => (
              <Badge
                key={idx}
                variant='destructive'
                className='text-[9px] md:text-[10px] h-5 px-2 font-bold whitespace-nowrap shadow-none'
              >
                {disease}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* منطقة الأزرار (ريسبونسف) */}
      <div className='flex items-center gap-2 flex-wrap justify-start lg:justify-end shrink-0 pt-2 lg:pt-1'>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant='secondary'
              size='sm'
              className='bg-muted/50 hover:bg-muted text-foreground h-9 border shadow-sm w-full sm:w-auto flex-1 sm:flex-none'
            >
              <History className='w-4 h-4 ml-1 sm:ml-2' />
              <span>التاريخ المرضي</span>
            </Button>
          </SheetTrigger>
          <SheetContent side='right' className='w-full sm:max-w-md overflow-y-auto pt-10 px-5'>
            <SheetHeader className='mb-6'>
              <SheetTitle className='flex items-center gap-2 text-primary border-b pb-4'>
                التاريخ المرضي: {visit.patientName}
              </SheetTitle>
            </SheetHeader>
            <HistoryTab summary={summary} tenantSlug={tenantSlug} currentVisitId={visit.id} />
          </SheetContent>
        </Sheet>

        <Button
          variant='outline'
          size='sm'
          onClick={handlePrint}
          className='h-9 shadow-sm w-full sm:w-auto flex-1 sm:flex-none'
        >
          <Printer className='w-4 h-4 ml-1 sm:ml-2' />
          <span>طباعة الروشتة</span>
        </Button>

        {!isClosed && (
          <Button
            onClick={onComplete}
            disabled={isCompleting}
            size='sm'
            className='h-9 shadow-sm w-full sm:w-auto mt-2 sm:mt-0'
          >
            {isCompleting ? 'جاري...' : 'حفظ وإنهاء الزيارة'}
          </Button>
        )}
      </div>
    </div>
  )
}

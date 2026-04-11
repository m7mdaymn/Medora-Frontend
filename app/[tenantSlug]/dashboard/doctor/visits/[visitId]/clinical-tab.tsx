'use client'

import { IVisit } from '@/types/visit'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Form, FormControl, FormField } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Activity, CalendarIcon, FileText } from 'lucide-react'
import { updateVisit } from '../../../../../../actions/visit/update-visit'
import { vitalsFields } from '../../../../../../constants/vitals-fields'
import { IDoctor, IDoctorVisitConfig } from '../../../../../../types/doctor'
import { ClinicalFormInput, clinicalSchema } from '../../../../../../validation/visit'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format, isBefore, startOfDay } from 'date-fns'
import { ar } from 'date-fns/locale'

interface ClinicalTabProps {
  tenantSlug: string
  visit: IVisit
  doctor?: IDoctor
  isClosed?: boolean
}

export function ClinicalTab({ tenantSlug, visit, doctor, isClosed }: ClinicalTabProps) {
  const form = useForm<ClinicalFormInput>({
    resolver: valibotResolver(clinicalSchema),
    defaultValues: {
      complaint: visit.complaint ?? '',
      diagnosis: visit.diagnosis ?? '',
      notes: visit.notes ?? null,
      bloodPressureSystolic: visit.bloodPressureSystolic ?? null,
      bloodPressureDiastolic: visit.bloodPressureDiastolic ?? null,
      heartRate: visit.heartRate ?? null,
      temperature: visit.temperature ?? null,
      weight: visit.weight ?? null,
      height: visit.height ?? null,
      bmi: visit.bmi ?? null,
      bloodSugar: visit.bloodSugar ?? null,
      oxygenSaturation: visit.oxygenSaturation ?? null,
      respiratoryRate: visit.respiratoryRate ?? null,
    },
  })

  const onSubmit = async (data: ClinicalFormInput) => {
    if (isClosed) return
    try {
      const loadingToast = toast.loading('جاري حفظ البيانات...')
      const response = await updateVisit(tenantSlug, visit.id, data)
      toast.dismiss(loadingToast)

      if (response.success) {
        toast.success('تم الحفظ')
        // 🔥 الحل هنا: بنحدث الفورم بالداتا اللي لسه باعتينها عشان تفضل معروضة
        form.reset(data)
      } else {
        toast.error(response.message || 'فشل الحفظ')
      }
    } catch (error) {
      toast.dismiss()
      toast.error('حدث خطأ غير متوقع')
    }
  }

  const autoGrow = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget
    target.style.height = 'auto'
    target.style.height = `${target.scrollHeight}px`
  }

  const visibleVitals = vitalsFields.filter(
    (fieldConfig) =>
      !doctor?.visitFieldConfig ||
      doctor?.visitFieldConfig[fieldConfig.configKey as keyof IDoctorVisitConfig],
  )

  const visitDate = visit.startedAt ? startOfDay(new Date(visit.startedAt)) : startOfDay(new Date())

  return (
    <Form {...form}>
      <form id='clinical-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        {/* 1. العلامات الحيوية */}
        {visibleVitals.length > 0 && (
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 p-3 bg-muted/30 rounded-xl border border-dashed'>
            {visibleVitals.map((fieldConfig) => (
              <FormField
                key={fieldConfig.name}
                control={form.control}
                name={fieldConfig.name}
                render={({ field }) => (
                  <div className='flex flex-col gap-1 bg-background p-2 rounded-lg border shadow-sm'>
                    <span className='text-[10px] font-bold text-muted-foreground uppercase'>
                      {fieldConfig.label}
                    </span>
                    <FormControl>
                      <input
                        type='number'
                        disabled={isClosed}
                        className='w-full bg-transparent focus:outline-none text-sm font-black text-primary'
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? null : Number(e.target.value))
                        }
                      />
                    </FormControl>
                  </div>
                )}
              />
            ))}
          </div>
        )}

        <div className='flex items-center gap-2 border-b pb-2'>
          <Activity className='w-4 h-4 text-muted-foreground' />
          <h3 className='text-sm font-semibold text-foreground'>التشخيص الطبي</h3>
        </div>

        {/* 2. شريط الكشف (Responsive + Auto-grow) */}
        <div className='flex flex-col md:flex-row items-stretch bg-card border rounded-lg shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-primary transition-all duration-200'>
          <div className='hidden md:flex items-center px-3 text-muted-foreground/30 border-l bg-muted/5'>
            <FileText className='w-4 h-4' />
          </div>

          <FormField
            control={form.control}
            name='complaint'
            render={({ field }) => (
              <FormControl className='flex-1'>
                <Textarea
                  placeholder='الشكوى...'
                  className='min-h-11.25 md:min-h-10 max-h-60 border-0 border-b md:border-b-0 focus-visible:ring-0 text-sm bg-transparent resize-none py-3 px-4 leading-relaxed scrollbar-hide'
                  disabled={isClosed}
                  rows={1}
                  onInput={autoGrow}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
            )}
          />

          <div className='hidden md:block w-px bg-muted/50 opacity-30 self-stretch' />

          <FormField
            control={form.control}
            name='diagnosis'
            render={({ field }) => (
              <FormControl className='flex-1'>
                <Textarea
                  placeholder='التشخيص...'
                  className='min-h-11.25 md:min-h-10 max-h-60 border-0 border-b md:border-b-0 focus-visible:ring-0 text-sm font-bold text-primary bg-transparent resize-none py-3 px-4 leading-relaxed scrollbar-hide'
                  disabled={isClosed}
                  rows={1}
                  onInput={autoGrow}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
            )}
          />

          <div className='hidden md:block w-px bg-muted/50 opacity-30 self-stretch' />

          <FormField
            name='notes'
            control={form.control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='ghost'
                    disabled={isClosed}
                    className={cn(
                      'h-11 md:h-auto md:min-h-10 px-4 text-xs gap-2 hover:bg-muted font-normal shrink-0 rounded-none w-full md:w-auto md:border-r self-center',
                      !field.value && 'text-muted-foreground/50',
                    )}
                  >
                    <CalendarIcon className='h-3.5 w-3.5 opacity-50' />
                    {field.value && !isNaN(new Date(field.value).getTime())
                      ? format(new Date(field.value), 'dd/MM/yy', { locale: ar })
                      : 'الاستشارة'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='end'>
                  <Calendar
                    mode='single'
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? date.toISOString() : null)}
                    disabled={(date) => isBefore(startOfDay(date), visitDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
        </div>
      </form>
    </Form>
  )
}

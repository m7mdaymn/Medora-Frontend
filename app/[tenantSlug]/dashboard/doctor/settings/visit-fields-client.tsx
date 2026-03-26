'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { IDoctorVisitConfig } from '@/types/doctor'
import { VISIT_CONFIG_LABELS } from '@/constants/visit-fields'
import { updateMyVisitFieldsAction } from '../../../../../actions/doctor/update-my-visit-fields'

interface Props {
  tenantSlug: string
  initialConfig: IDoctorVisitConfig
}

export function VisitFieldsClient({ tenantSlug, initialConfig }: Props) {
  const [config, setConfig] = useState<IDoctorVisitConfig>(initialConfig)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (key: keyof IDoctorVisitConfig) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateMyVisitFieldsAction(
        tenantSlug,
        config as unknown as Record<string, boolean>,
      )

      if (res.success) {
        toast.success('تم حفظ إعدادات الكشف بنجاح')
      } else {
        toast.error(res.message || 'حدث خطأ أثناء الحفظ')
      }
    })
  }

  return (
    <Card className='border shadow-sm'>
      <CardContent className='p-6 sm:p-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 py-4 '>
          {(Object.keys(VISIT_CONFIG_LABELS) as Array<keyof IDoctorVisitConfig>).map((key) => (
            <div
              key={key}
              className='flex items-center justify-between border-b pb-3 hover:bg-muted/30 p-2 rounded-md transition-colors'
            >
              <Label htmlFor={key} className='text-base font-semibold cursor-pointer w-full'>
                {VISIT_CONFIG_LABELS[key]}
              </Label>
              <Switch
                id={key}
                checked={config[key]}
                onCheckedChange={() => handleToggle(key)}
                disabled={isPending}
                dir='ltr'
                className='data-[state=checked]:bg-primary'
              />
            </div>
          ))}
        </div>

        <div className='flex justify-end pt-6 mt-4 border-t'>
          <Button onClick={handleSave} disabled={isPending} size='lg' className='px-8'>
            {isPending ? (
              <Loader2 className='w-4 h-4 ml-2 animate-spin' />
            ) : (
              <Save className='w-4 h-4 ml-2' />
            )}
            حفظ الإعدادات
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

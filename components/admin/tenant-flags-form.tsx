'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import { UpdateFeatureFlagsSchema, UpdateFeatureFlagsInput } from '@/validation/feature-flags'
import { updateTenantFlags } from '@/actions/platform/feature-flags'
import { IFeatureFlags } from '../../types/feature-flags'

interface TenantFlagsFormProps {
  tenantId: string
  initialData: IFeatureFlags
}

export function TenantFlagsForm({ tenantId, initialData }: TenantFlagsFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<UpdateFeatureFlagsInput>({
    resolver: valibotResolver(UpdateFeatureFlagsSchema),
    defaultValues: {
      onlineBooking: initialData.onlineBooking,
      whatsappAutomation: initialData.whatsappAutomation,
      pwaNotifications: initialData.pwaNotifications,
      expensesModule: initialData.expensesModule,
      advancedMedicalTemplates: initialData.advancedMedicalTemplates,
      ratings: initialData.ratings,
      export: initialData.export,
    },
  })

  function onSubmit(data: UpdateFeatureFlagsInput) {
    startTransition(async () => {
      const res = await updateTenantFlags(tenantId, data)
      if (res.success) {
        toast.success('تم تحديث خواص النظام بنجاح')
      } else {
        toast.error(res.message || 'فشل التحديث')
      }
    })
  }

  // مصفوفة عشان نكرر الـ Fields بدل ما نكتب كود كتير مكرر (DRY)
  const flags = [
    { name: 'onlineBooking', label: 'الحجز أونلاين', desc: 'تفعيل حجز المواعيد عبر الإنترنت' },
    { name: 'whatsappAutomation', label: 'أتمتة الواتساب', desc: 'إرسال رسائل تذكير تلقائية' },
    { name: 'pwaNotifications', label: 'تنبيهات PWA', desc: 'تفعيل إشعارات التطبيق على الموبايل' },
    { name: 'expensesModule', label: 'موديول المصاريف', desc: 'إدارة الحسابات والمصاريف الداخلية' },
    {
      name: 'advancedMedicalTemplates',
      label: 'قوالب طبية متقدمة',
      desc: 'استخدام نماذج تشخيص متطورة',
    },
    { name: 'ratings', label: 'التقييمات', desc: 'السماح للمرضى بتقييم الخدمة' },
    { name: 'export', label: 'تصدير البيانات', desc: 'إمكانية سحب البيانات Excel/PDF' },
  ] as const

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 py-4'>
        <div className='space-y-4'>
          {flags.map((flag, index) => (
            <div key={flag.name}>
              <FormField
                control={form.control}
                name={flag.name}
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-card'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>{flag.label}</FormLabel>
                      <FormDescription>{flag.desc}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                        dir='ltr'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {index < flags.length - 1 && <Separator className='my-2 opacity-0' />}
            </div>
          ))}
        </div>

        <Button type='submit' className='w-full gap-2' disabled={isPending}>
          {isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
          حفظ كافة التغييرات
        </Button>
      </form>
    </Form>
  )
}

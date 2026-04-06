import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { DAYS_AR } from '@/types/public'
import { UpdateSettingsInput } from '@/validation/settings'
import { FieldArrayWithId, UseFormReturn } from 'react-hook-form'

interface WorkingHoursSettingsSectionProps {
  form: UseFormReturn<UpdateSettingsInput>
  fields: FieldArrayWithId<UpdateSettingsInput, 'workingHours', 'id'>[]
}

export function WorkingHoursSettingsSection({ form, fields }: WorkingHoursSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>أوقات العمل</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {fields.map((workingHourField, index) => (
          <div key={workingHourField.id} className='flex items-end gap-4 border-b pb-4'>
            <div className='w-24 font-bold'>{DAYS_AR[workingHourField.dayOfWeek]}</div>

            <FormField
              control={form.control}
              name={`workingHours.${index}.startTime`}
              render={({ field }) => (
                <FormItem className='flex-1'>
                  <FormLabel>من</FormLabel>
                  <FormControl>
                    <Input type='time' step='1' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`workingHours.${index}.endTime`}
              render={({ field }) => (
                <FormItem className='flex-1'>
                  <FormLabel>إلى</FormLabel>
                  <FormControl>
                    <Input type='time' step='1' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`workingHours.${index}.isActive`}
              render={({ field }) => (
                <FormItem className='pb-2'>
                  <FormLabel>يعمل؟</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} dir='ltr' />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

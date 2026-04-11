import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { UpdateSettingsInput } from '@/validation/settings'
import { UseFormReturn } from 'react-hook-form'

interface BookingSettingsSectionProps {
  form: UseFormReturn<UpdateSettingsInput>
}

export function BookingSettingsSection({ form }: BookingSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>إعدادات الحجز</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <FormField
          control={form.control}
          name='bookingEnabled'
          render={({ field }) => (
            <FormItem className='flex items-center justify-between border p-4 rounded-lg'>
              <FormLabel>تفعيل الحجز الأونلاين</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} dir='ltr' />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='cancellationWindowHours'
          render={({ field }) => (
            <FormItem>
              <FormLabel>فترة الإلغاء (ساعات)</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}

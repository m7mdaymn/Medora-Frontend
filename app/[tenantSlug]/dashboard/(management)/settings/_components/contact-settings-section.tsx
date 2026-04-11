import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { UpdateSettingsInput } from '@/validation/settings'
import { UseFormReturn } from 'react-hook-form'

interface ContactSettingsSectionProps {
  form: UseFormReturn<UpdateSettingsInput>
}

export function ContactSettingsSection({ form }: ContactSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>أرقام التواصل</CardTitle>
      </CardHeader>
      <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='phone'
          render={({ field }) => (
            <FormItem>
              <FormLabel>رقم هاتف العيادة</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='supportPhoneNumber'
          render={({ field }) => (
            <FormItem>
              <FormLabel>رقم هاتف الدعم</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='whatsAppSenderNumber'
          render={({ field }) => (
            <FormItem>
              <FormLabel>رقم مرسل واتساب</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='supportWhatsAppNumber'
          render={({ field }) => (
            <FormItem>
              <FormLabel>رقم واتساب الدعم (للمرضى)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}

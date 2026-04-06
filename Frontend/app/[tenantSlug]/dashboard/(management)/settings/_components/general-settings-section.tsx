import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { UpdateSettingsInput } from '@/validation/settings'
import { UseFormReturn } from 'react-hook-form'

interface GeneralSettingsSectionProps {
  form: UseFormReturn<UpdateSettingsInput>
}

export function GeneralSettingsSection({ form }: GeneralSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>البيانات الأساسية</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <FormField
          control={form.control}
          name='clinicName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم العيادة</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='city'
            render={({ field }) => (
              <FormItem>
                <FormLabel>المدينة</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='address'
            render={({ field }) => (
              <FormItem>
                <FormLabel>العنوان</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}

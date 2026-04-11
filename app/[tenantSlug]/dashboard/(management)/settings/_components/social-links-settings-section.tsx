import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { UpdateSettingsInput } from '@/validation/settings'
import { UseFormReturn } from 'react-hook-form'

interface SocialLinksSettingsSectionProps {
  form: UseFormReturn<UpdateSettingsInput>
}

export function SocialLinksSettingsSection({ form }: SocialLinksSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>روابط السوشيال</CardTitle>
      </CardHeader>
      <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='socialLinks.address'
          render={({ field }) => (
            <FormItem>
              <FormLabel>موقع عنوان العيادة</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder='https://...' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='socialLinks.facebook'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Facebook</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder='https://...' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='socialLinks.instagram'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instagram</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder='https://...' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='socialLinks.x'
          render={({ field }) => (
            <FormItem>
              <FormLabel>X (Twitter)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder='https://...' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='socialLinks.youtube'
          render={({ field }) => (
            <FormItem>
              <FormLabel>YouTube</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder='https://...' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='socialLinks.tiktok'
          render={({ field }) => (
            <FormItem>
              <FormLabel>TikTok</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder='https://...' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}

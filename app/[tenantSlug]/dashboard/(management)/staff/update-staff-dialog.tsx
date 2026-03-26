'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ROLE_CONFIG } from '@/config/roles'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { IStaff } from '../../../../../types/staff'
import { UpdateStaffInput, updateStaffSchema } from '../../../../../validation/staff'
import { updateStaffAction } from '../../../../../actions/staff/update-staff'
import { toggleStaffStatusAction } from '../../../../../actions/staff/toggle-staff-status'

interface Props {
  staff: IStaff
  tenantSlug: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpdateStaffDialog({ staff, tenantSlug, open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false)

  const form = useForm<UpdateStaffInput>({
    resolver: valibotResolver(updateStaffSchema),
    defaultValues: {
      id: staff.id,
      name: staff.name,
      phone: staff.phone || '',
      salary: staff.salary || 0,
      isEnabled: staff.isEnabled,
    },
  })

  async function onSubmit(values: UpdateStaffInput) {
    setLoading(true)
    let hasError = false

    try {
      const updateRes = await updateStaffAction(values, tenantSlug)

      if (!updateRes.success) {
        toast.error(updateRes.message)
        hasError = true
      }

      if (!hasError && values.isEnabled !== staff.isEnabled) {
        const statusRes = await toggleStaffStatusAction(staff.id, values.isEnabled, tenantSlug)

        if (!statusRes.success) {
          toast.error(statusRes.message)
          hasError = true
        }
      }

      if (!hasError) {
        toast.success('تم الحفظ بنجاح')
        onOpenChange(false)
      }
    } catch (err) {
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-125'>
        <DialogHeader>
          <DialogTitle>تعديل بيانات: {staff.name}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الهاتف</FormLabel>
                    <FormControl>
                      <Input {...field} dir='ltr' className='text-right' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormItem>
                <FormLabel>الوظيفة</FormLabel>
                <FormControl>
                  <Input
                    value={ROLE_CONFIG[staff.role as keyof typeof ROLE_CONFIG]?.label || staff.role}
                    disabled
                    className='bg-muted'
                  />
                </FormControl>
              </FormItem>

              <FormField
                control={form.control}
                name='salary'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الراتب (ج.م)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='isEnabled'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-lg border p-3'>
                  <div className='space-y-0.5'>
                    <FormLabel>تفعيل الحساب</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} dir='ltr' />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type='submit' disabled={loading} className='w-full'>
              {loading ? <Loader2 className='animate-spin mr-2' /> : 'حفظ التعديلات'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

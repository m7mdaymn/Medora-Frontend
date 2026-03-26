'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { Loader2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { createClinicServiceAction } from '@/actions/service/clinic-services'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Textarea } from '@/components/ui/textarea'
import { ClinicServiceInput, ClinicServiceSchema } from '@/validation/services'

interface Props {
  tenantSlug: string
}

export function AddServiceModal({ tenantSlug }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const form = useForm({
    resolver: valibotResolver(ClinicServiceSchema),
    defaultValues: {
      name: '',
      description: '',
      defaultPrice: 0,
      defaultDurationMinutes: 15,
      isActive: true,
    },
  })

  const onSubmit = async (values: ClinicServiceInput) => {
    try {
      const result = await createClinicServiceAction(tenantSlug, values)
      if (result.success) {
        toast.success('تمت إضافة الخدمة بنجاح')
        setOpen(false)
        form.reset()
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='font-bold'>
          <Plus className='mr-2 h-4 w-4' /> خدمة جديدة
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-125' dir='rtl'>
        <DialogHeader>
          <DialogTitle>إضافة خدمة جديدة</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الخدمة</FormLabel>
                  <FormControl>
                    <Input placeholder='مثال: كشف باطنة...' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='defaultPrice'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر الافتراضي</FormLabel>
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
              <FormField
                control={form.control}
                name='defaultDurationMinutes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدة (دقائق)</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وصف الخدمة</FormLabel>
                  <FormControl>
                    <Textarea className='resize-none' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='isActive'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-lg border p-3 shadow-sm'>
                  <div className='space-y-0.5'>
                    <FormLabel>حالة الخدمة</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} dir='ltr' />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              type='submit'
              className='w-full font-bold'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              إضافة الخدمة
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

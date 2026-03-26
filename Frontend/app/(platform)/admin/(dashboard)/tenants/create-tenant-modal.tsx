'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { Loader2, Plus } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

import { CreateTenantInput, CreateTenantSchema } from '@/validation/tenant'
import { createTenantAction } from '../../../../../actions/platform/create-tenant'

export function CreateTenantModal() {
  const [open, setOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<CreateTenantInput>({
    resolver: valibotResolver(CreateTenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      contactPhone: '',
      address: '',
      ownerName: '',
      ownerUsername: '',
      ownerPassword: '',
      ownerPhone: '',
    },
  })

  function onSubmit(data: CreateTenantInput) {
    startTransition(async () => {
      const res = await createTenantAction(data)

      if (res.success) {
        toast.success('تم إنشاء العيادة وحساب المدير بنجاح')
        form.reset()
        setOpen(false)
      } else {
        toast.error(res.message || 'حدث خطأ أثناء الإنشاء')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='lg' className='gap-2 font-bold shadow-md'>
          <Plus className='w-5 h-5' />
          إضافة عيادة جديدة
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>تسجيل عيادة جديدة</DialogTitle>
          <DialogDescription>
            أدخل بيانات العيادة وبيانات حساب المالك الأساسي لإنشاء مساحة عمل جديدة.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 mt-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* القسم الأول: بيانات العيادة */}
              <div className='space-y-4 bg-muted/30 p-4 rounded-lg border'>
                <h3 className='font-bold text-primary mb-2 border-b pb-2'>بيانات العيادة</h3>

                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم العيادة *</FormLabel>
                      <FormControl>
                        <Input placeholder='عيادة النور' disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='slug'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المعرف (Slug) *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='al-noor-clinic'
                          dir='ltr'
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='contactPhone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم هاتف العيادة</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='010...'
                          dir='ltr'
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                        />
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
                        <Input
                          placeholder='القاهرة، شارع...'
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* القسم الثاني: بيانات المالك */}
              <div className='space-y-4 bg-muted/30 p-4 rounded-lg border'>
                <h3 className='font-bold text-primary mb-2 border-b pb-2'>بيانات المالك الأساسي</h3>

                <FormField
                  control={form.control}
                  name='ownerName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المالك *</FormLabel>
                      <FormControl>
                        <Input placeholder='د. أحمد' disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='ownerUsername'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المستخدم *</FormLabel>
                      <FormControl>
                        <Input placeholder='dr.ahmed' dir='ltr' disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='ownerPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور *</FormLabel>
                      <FormControl>
                        <Input
                          type='password'
                          placeholder='••••••••'
                          dir='ltr'
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='ownerPhone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم هاتف المالك</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='010...'
                          dir='ltr'
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className='flex justify-end gap-3 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                إلغاء
              </Button>
              <Button type='submit' disabled={isPending}>
                {isPending ? <Loader2 className='w-4 h-4 ml-2 animate-spin' /> : null}
                إنشاء العيادة
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

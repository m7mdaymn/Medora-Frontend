'use client'

import { createStaffAction } from '@/actions/staff/create-staff'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { CreateStaffInput, createStaffSchema } from '../../../../../validation/staff'
import { ROLE_CONFIG, ROLES } from '../../../../../config/roles'


interface Props {
  tenantSlug: string
  onSuccess: () => void
}

export function CreateStaffForm({ tenantSlug, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)

  const form = useForm<CreateStaffInput>({
    resolver: valibotResolver(createStaffSchema),
    defaultValues: {
      name: '',
      username: '',
      password: '',
      role: '',
      phone: '',
      salary: 0,
      notes: '',
      hireDate: new Date().toISOString().split('T')[0],
    },
  })

  async function onSubmit(values: CreateStaffInput) {
    setLoading(true)
    const res = await createStaffAction(values, tenantSlug)
    setLoading(false)

    if (res.success) {
      toast.success(res.message)
      form.reset()
      onSuccess() // هنا بنقول للأب (المودال) اقفل نفسك
    } else {
      toast.error(res.message)
    }
  }

  return (
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
                  <Input placeholder='الاسم بالكامل' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='username'
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم المستخدم</FormLabel>
                <FormControl>
                  <Input placeholder='username' {...field} autoComplete='one-time-code' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>كلمة المرور</FormLabel>
                <FormControl>
                  <Input type='password' {...field} autoComplete='new-password'/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='role'
            render={({ field }) => (
              <FormItem>
                <FormLabel>الوظيفة</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='اختر وظيفة' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>

                    {[ROLES.CLINIC_MANAGER, ROLES.RECEPTIONIST].map(
                      (roleKey) => (
                        <SelectItem key={roleKey} value={roleKey}>
                          {ROLE_CONFIG[roleKey].label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='phone'
            render={({ field }) => (
              <FormItem>
                <FormLabel>الهاتف</FormLabel>
                <FormControl>
                  <Input placeholder='01xxxxxxxxx' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='salary'
            render={({ field }) => (
              <FormItem>
                <FormLabel>الراتب</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    {...field}
                    value={Number.isNaN(field.value) ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='hireDate'
          render={({ field }) => (
            <FormItem>
              <FormLabel>تاريخ التعيين</FormLabel>
              <FormControl>
                <Input type='date' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='notes'
          render={({ field }) => (
            <FormItem>
              <FormLabel>ملاحظات</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' disabled={loading} className='w-full'>
          {loading ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <Plus className='mr-2 h-4 w-4' />
          )}
          إضافة الموظف
        </Button>
      </form>
    </Form>
  )
}

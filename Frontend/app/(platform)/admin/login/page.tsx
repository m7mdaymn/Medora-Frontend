'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation' // ضفنا الـ Router

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { superAdminLoginAction } from '../../../../actions/admin/login'
import { LoginInput, LoginSchema } from '../../../../validation/login'

// استدعي الستور بتاعك من مساره الصحيح (عدل المسار لو مختلف عندك)
import { useAuthStore } from '@/store/useAuthStore'

export default function SuperAdminLoginPage() {
  const [isPending, startTransition] = React.useTransition()
  const router = useRouter()

  // سحبنا الـ setAuth من الـ Store
  const setAuth = useAuthStore((state) => state.setAuth)

  const form = useForm<LoginInput>({
    resolver: valibotResolver(LoginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  function onSubmit(data: LoginInput) {
    startTransition(async () => {
      const res = await superAdminLoginAction(data)

      if (res && !res.success) {
        toast.error(res.message || 'بيانات الدخول غير صحيحة')
        return
      }

      if (res && res.success && res.data) {
        // 1. خزن بيانات السوبر أدمن في Zustand
        setAuth(res.data)

        toast.success('تم تسجيل الدخول بنجاح')

        // 2. وجهه للداشبورد من الكلاينت
        router.push('/admin')
      }
    })
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-muted/30 p-4'>
      <Card className='w-full max-w-md shadow-lg border-primary/10'>
        <CardHeader className='space-y-2 text-center'>
          <CardTitle className='text-2xl font-bold'>إدارة المنصة</CardTitle>
          <CardDescription>سجل دخولك كمدير عام للتحكم في العيادات والاشتراكات</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المستخدم</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} dir='ltr' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='••••••••'
                        {...field}
                        disabled={isPending}
                        dir='ltr'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type='submit' className='w-full h-11 text-md font-bold' disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className='ml-2 w-5 h-5 animate-spin' />
                    جاري التحقق...
                  </>
                ) : (
                  'تسجيل الدخول'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

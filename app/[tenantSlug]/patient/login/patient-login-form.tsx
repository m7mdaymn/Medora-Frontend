'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { ArrowRight, KeyRound, Loader2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import Link from 'next/link'

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
import { ClinicImage } from '@/components/shared/clinic-image'

import { patientLoginAction } from '../../../../actions/auth/patientLogin' 
import { usePatientAuthStore } from '@/store/usePatientAuthStore'
import { LoginInput, LoginSchema } from '@/validation/login'

export function PatientLoginForm({
  tenantSlug,
  clinicName,
  logoUrl,
}: {
  tenantSlug: string
  clinicName?: string
  logoUrl?: string
}) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginInput>({
    resolver: valibotResolver(LoginSchema),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = async (values: LoginInput) => {
    setIsLoading(true)
    try {
      const result = await patientLoginAction(values, tenantSlug)
      if (!result.success || !result.data) throw new Error(result.message)

      usePatientAuthStore.getState().setPatientAuth(tenantSlug, result.data)

      toast.success('تم تسجيل الدخول بنجاح')
      window.location.href = `/${tenantSlug}/patient`
    } catch (error) {
      if (error instanceof Error) toast.error(error.message || 'خطأ في الدخول')
      setIsLoading(false)
    }
  }

  return (
    <div className='flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-700'>
      <Button
        variant='ghost'
        className='self-start flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-10 p-0 h-auto hover:bg-transparent'
        asChild
      >
        <Link href={`/${tenantSlug}`}>
          <ArrowRight className='h-4 w-4' />
          <span>العودة للرئيسية</span>
        </Link>
      </Button>

      <div className='flex flex-col space-y-8'>
        <div className='flex flex-col space-y-2 text-center lg:text-right'>
          <div className='lg:hidden flex justify-center mb-4'>
            {logoUrl ? (
              <ClinicImage
                src={logoUrl}
                alt='Logo'
                width={48}
                height={48}
                className='rounded-lg shadow-sm bg-white p-1 object-contain'
                fallbackType='logo'
              />
            ) : (
              <div className='w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl'>
                {clinicName?.charAt(0) || tenantSlug.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h2 className='text-2xl sm:text-3xl font-black tracking-tight text-foreground'>
            بوابة المرضى
          </h2>
          <p className='text-sm font-medium text-muted-foreground'>
            مرحباً بك في {clinicName || 'العيادة'}، أدخل رقم هاتفك للمتابعة.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
            <div className='space-y-4'>
              {/* حقل اسم المستخدم / رقم الهاتف */}
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem className='space-y-2'>
                    <FormLabel className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                      اسم المستخدم أو رقم الهاتف
                    </FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <UserRound className='absolute right-3 top-2.5 h-4 w-4 text-muted-foreground' />
                        <Input
                          placeholder='01xxxxxxxxx'
                          className='pr-9 pl-3 h-11 bg-muted/20 border-border/50 focus-visible:ring-primary/20 text-left'
                          dir='ltr'
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className='text-xs font-bold' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='space-y-2'>
                    <FormLabel className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                      كلمة المرور
                    </FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <KeyRound className='absolute right-3 top-2.5 h-4 w-4 text-muted-foreground' />
                        <Input
                          type='password'
                          placeholder='••••••••'
                          className='pr-9 pl-3 h-11 bg-muted/20 border-border/50 focus-visible:ring-primary/20 text-left'
                          dir='ltr'
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className='text-xs font-bold' />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type='submit'
              variant={'gradient'}
              size={'lg'}
              className='w-full'
              disabled={isLoading}
            >
              {isLoading && <Loader2 className='ml-2 h-5 w-5 animate-spin' />}
              تسجيل الدخول
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}

'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { ArrowRight, KeyRound, Loader2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

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

import { loginAction } from '@/actions/auth/login'
import { useAuthStore } from '@/store/useAuthStore'
import { LoginInput, LoginSchema } from '@/validation/login'

export function LoginForm({
  tenantSlug,
  clinicName,
  logoUrl,
}: {
  tenantSlug: string
  clinicName?: string
  logoUrl?: string
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginInput>({
    resolver: valibotResolver(LoginSchema),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = async (values: LoginInput) => {
    setIsLoading(true)
    try {
      const result = await loginAction(values, tenantSlug)
      if (!result.success || !result.data) throw new Error(result.message)

      useAuthStore.getState().setAuth(result.data)
      toast.success('تم تسجيل الدخول بنجاح')
      router.push(`/${tenantSlug}/dashboard`)
    } catch (error) {
      if (error instanceof Error) toast.error(error.message || 'خطأ في الدخول')
      setIsLoading(false)
    }
  }

  return (
    <div className='flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-700'>
      <button
        onClick={() => router.push(`/${tenantSlug}`)}
        type='button'
        className='self-start flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-10'
      >
        <ArrowRight className='size-4' />
        <span>العودة للرئيسية</span>
      </button>

      <div className='flex flex-col space-y-8'>
        <div className='flex flex-col space-y-2 text-center lg:text-right'>
          <div className='lg:hidden flex justify-center mb-4'>
            {logoUrl ? (
              <ClinicImage
                src={logoUrl}
                alt='Logo'
                width={48}
                height={48}
                className='rounded-lg shadow-sm  p-1 object-contain'
                fallbackType='logo'
              />
            ) : (
              <div className='w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl'>
                {clinicName?.charAt(0) || tenantSlug.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h2 className='text-2xl sm:text-3xl font-black tracking-tight text-foreground'>
            تسجيل الدخول
          </h2>
          <p className='text-sm font-medium text-muted-foreground'>
            مرحباً بك في {clinicName || 'النظام'}، أدخل بياناتك للمتابعة.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
            <div className='space-y-4'>
              {/* حقل اسم المستخدم */}
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem className='space-y-2'>
                    <FormLabel className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                      اسم المستخدم
                    </FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <UserRound className='absolute right-3 top-2.5 h-4 w-4 text-muted-foreground' />
                        <Input
                          placeholder='example123'
                          className='pl-3 pr-10 h-11 bg-muted/20 border-border/50 focus-visible:ring-primary/20 text-left'
                          dir='ltr'
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className='text-xs font-bold' />
                  </FormItem>
                )}
              />

              {/* حقل كلمة المرور */}
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
                          className='pl-3 pr-10 h-11 bg-muted/20 border-border/50 focus-visible:ring-primary/20 text-left'
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

            {/* زرار الدخول */}
            <Button
              type='submit'
              className='w-full'
              size={'lg'}
              variant={'gradient'}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                  جاري التحقق...
                </>
              ) : (
                'دخول'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}

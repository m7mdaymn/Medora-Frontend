'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { Loader2, Plus } from 'lucide-react'
import * as React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  getTenantClassificationFromKind,
  getTenantKindLabel,
  TENANT_KIND_OPTIONS,
} from '@/lib/tenant-kind'
import { useAuthStore } from '@/store/useAuthStore'

import { CreateTenantInput, CreateTenantSchema } from '@/validation/tenant'
import { createTenantAction } from '../../../../../actions/platform/create-tenant'
import { getTenants } from '../../../../../actions/platform/get-tenants'
import { ITenant } from '@/types/platform'

export function CreateTenantModal() {
  const currentRole = useAuthStore((state) => state.user?.role)
  const [open, setOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()
  const [availableTenants, setAvailableTenants] = React.useState<ITenant[]>([])
  const [isLoadingTenants, setIsLoadingTenants] = React.useState(false)

  const form = useForm<CreateTenantInput>({
    resolver: valibotResolver(CreateTenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      contactPhone: '',
      address: '',
      logoUrl: '',
      tenantKind: 'Clinic',
      hasBranches: false,
      initialBranchNames: '',
      linkedTenantIds: [],
      ownerName: '',
      ownerUsername: '',
      ownerPassword: '',
      ownerPhone: '',
    },
  })

  const tenantKind = useWatch({
    control: form.control,
    name: 'tenantKind',
  })
  const hasBranches = useWatch({
    control: form.control,
    name: 'hasBranches',
  })

  const tenantClassification = React.useMemo(
    () => getTenantClassificationFromKind(tenantKind),
    [tenantKind],
  )
  const isClinic = tenantClassification.isClinic

  React.useEffect(() => {
    if (!open) return

    let mounted = true
    setIsLoadingTenants(true)

    getTenants()
      .then((res) => {
        if (!mounted) return
        setAvailableTenants(res.data?.items || [])
      })
      .finally(() => {
        if (mounted) setIsLoadingTenants(false)
      })

    return () => {
      mounted = false
    }
  }, [open])

  React.useEffect(() => {
    if (!isClinic) {
      form.setValue('hasBranches', false)
      form.setValue('initialBranchNames', '')
    }

    form.setValue('linkedTenantIds', [])
  }, [form, isClinic])

  const selectableTenants = React.useMemo(() => {
    const targetType = isClinic ? 'Partner' : 'Clinic'
    return availableTenants.filter((tenant) => tenant.tenantType === targetType && tenant.status !== 'Blocked')
  }, [availableTenants, isClinic])

  if (currentRole !== 'SuperAdmin' && currentRole !== 'Worker') {
    return null
  }

  const entityLabel = getTenantKindLabel(tenantKind)

  function onSubmit(data: CreateTenantInput) {
    startTransition(async () => {
      const res = await createTenantAction(data)

      if (res.success) {
        toast.success(`تم إنشاء ${entityLabel} وحساب المدير بنجاح`)
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
          إضافة كيان جديد
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>تسجيل كيان جديد</DialogTitle>
          <DialogDescription>
            حدد نوع الكيان، إعداد الفروع إذا كان عيادة، ثم أدخل بيانات المدير الأساسي لإنشاء مساحة عمل جديدة.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 mt-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* القسم الأول: بيانات العيادة */}
              <div className='space-y-4 bg-muted/30 p-4 rounded-lg border'>
                <h3 className='font-bold text-primary mb-2 border-b pb-2'>بيانات الكيان</h3>

                <FormField
                  control={form.control}
                  name='tenantKind'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الكيان *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='اختر النوع' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TENANT_KIND_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم {entityLabel} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={isClinic ? 'عيادة النور' : `${entityLabel} الشفاء`}
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
                      <FormLabel>رقم هاتف الكيان</FormLabel>
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

                {isClinic && (
                  <FormField
                    control={form.control}
                    name='hasBranches'
                    render={({ field }) => (
                      <FormItem className='flex items-center justify-between rounded-lg border p-3'>
                        <div>
                          <FormLabel>هل لهذه العيادة فروع؟</FormLabel>
                          <p className='text-xs text-muted-foreground mt-1'>
                            عند التفعيل يمكنك إدخال الفروع المبدئية أثناء الإنشاء.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isPending}
                            dir='ltr'
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                {isClinic && hasBranches && (
                  <FormField
                    control={form.control}
                    name='initialBranchNames'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الفروع المبدئية</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder={'الفرع الرئيسي\nفرع التجمع\nفرع مدينة نصر'}
                            disabled={isPending}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <p className='text-xs text-muted-foreground'>
                          اكتب كل فرع في سطر مستقل (أو افصل بالفاصلة).
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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

                <FormField
                  control={form.control}
                  name='linkedTenantIds'
                  render={({ field }) => {
                    const currentValue = field.value || []

                    return (
                      <FormItem>
                        <FormLabel>
                          {isClinic
                            ? 'ربط بكيانات شركاء موجودة (اختياري)'
                            : 'ربط بعيادات موجودة (اختياري)'}
                        </FormLabel>
                        <div className='rounded-lg border p-3 space-y-2 max-h-44 overflow-y-auto bg-background'>
                          {isLoadingTenants ? (
                            <div className='text-sm text-muted-foreground flex items-center gap-2'>
                              <Loader2 className='h-4 w-4 animate-spin' />
                              جاري تحميل الكيانات...
                            </div>
                          ) : selectableTenants.length === 0 ? (
                            <p className='text-sm text-muted-foreground'>
                              لا توجد كيانات متاحة للربط حالياً.
                            </p>
                          ) : (
                            selectableTenants.map((tenant) => {
                              const checked = currentValue.includes(tenant.id)

                              return (
                                <label
                                  key={tenant.id}
                                  className='flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer'
                                >
                                  <div className='min-w-0'>
                                    <p className='text-sm font-medium truncate'>{tenant.name}</p>
                                    <p className='text-xs text-muted-foreground font-mono truncate'>
                                      {tenant.slug}
                                    </p>
                                  </div>
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(value) => {
                                      if (value) {
                                        field.onChange([...currentValue, tenant.id])
                                      } else {
                                        field.onChange(currentValue.filter((id) => id !== tenant.id))
                                      }
                                    }}
                                    disabled={isPending}
                                  />
                                </label>
                              )
                            })
                          )}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          يتيح ذلك إنشاء علاقة many-to-many بين العيادات والشركاء من البداية.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
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
                إنشاء {entityLabel}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

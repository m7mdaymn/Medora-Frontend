'use client'

import { getBranchesAction } from '@/actions/branch/branches'
import { toggleStaffStatusAction } from '@/actions/staff/toggle-staff-status'
import { updateStaffAction } from '@/actions/staff/update-staff'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Textarea } from '@/components/ui/textarea'
import { ROLE_CONFIG } from '@/config/roles'
import { IBranch } from '@/types/branch'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { IStaff } from '../../../../../types/staff'
import { UpdateStaffInput, updateStaffSchema } from '../../../../../validation/staff'

interface Props {
  staff: IStaff
  tenantSlug: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpdateStaffDialog({ staff, tenantSlug, open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<IBranch[]>([])
  const [isLoadingBranches, setIsLoadingBranches] = useState(false)

  const form = useForm<UpdateStaffInput>({
    resolver: valibotResolver(updateStaffSchema),
    defaultValues: {
      id: staff.id,
      name: staff.name,
      phone: staff.phone || '',
      salary: staff.salary || 0,
      hireDate: staff.hireDate ? staff.hireDate.split('T')[0] : '',
      notes: staff.notes || '',
      branchIds: staff.assignedBranchIds || [],
      isEnabled: staff.isEnabled,
    },
  })

  useEffect(() => {
    form.reset({
      id: staff.id,
      name: staff.name,
      phone: staff.phone || '',
      salary: staff.salary || 0,
      hireDate: staff.hireDate ? staff.hireDate.split('T')[0] : '',
      notes: staff.notes || '',
      branchIds: staff.assignedBranchIds || [],
      isEnabled: staff.isEnabled,
    })
  }, [form, staff])

  useEffect(() => {
    if (!open) return

    let isMounted = true

    const loadBranches = async () => {
      setIsLoadingBranches(true)
      const res = await getBranchesAction(tenantSlug, true)

      if (isMounted) {
        if (res.success && res.data) {
          setBranches(res.data)
        } else {
          toast.error(res.message || 'تعذر تحميل قائمة الفروع')
        }
        setIsLoadingBranches(false)
      }
    }

    void loadBranches()

    return () => {
      isMounted = false
    }
  }, [open, tenantSlug])

  function toggleBranchSelection(branchId: string, checked: boolean | 'indeterminate') {
    const current = form.getValues('branchIds') || []
    const shouldSelect = checked === true

    const next = shouldSelect
      ? Array.from(new Set([...current, branchId]))
      : current.filter((id) => id !== branchId)

    form.setValue('branchIds', next, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

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
    } catch {
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-3xl'>
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
                        value={Number.isNaN(field.value) ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.valueAsNumber
                          field.onChange(Number.isNaN(value) ? 0 : value)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='hireDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ التعيين</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='branchIds'
              render={({ field }) => (
                <FormItem>
                  <div className='flex items-center justify-between gap-2'>
                    <FormLabel>الفروع المخصصة</FormLabel>
                    {branches.length > 0 && (
                      <div className='flex items-center gap-2'>
                        <Button
                          type='button'
                          size='sm'
                          variant='ghost'
                          onClick={() => {
                            form.setValue(
                              'branchIds',
                              branches.filter((branch) => branch.isActive).map((branch) => branch.id),
                              { shouldDirty: true, shouldValidate: true },
                            )
                          }}
                        >
                          تحديد الكل
                        </Button>
                        <Button
                          type='button'
                          size='sm'
                          variant='ghost'
                          onClick={() =>
                            form.setValue('branchIds', [], {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          إلغاء التحديد
                        </Button>
                      </div>
                    )}
                  </div>
                  <FormControl>
                    <div className='space-y-2 rounded-md border p-3'>
                      {isLoadingBranches ? (
                        <p className='text-sm text-muted-foreground'>جاري تحميل الفروع...</p>
                      ) : branches.length === 0 ? (
                        <p className='text-sm text-muted-foreground'>لا توجد فروع متاحة حالياً</p>
                      ) : (
                        branches.map((branch) => (
                          <label
                            key={branch.id}
                            className='flex items-center justify-between rounded-md border px-3 py-2'
                          >
                            <div className='space-y-0.5'>
                              <p className='text-sm font-medium'>{branch.name}</p>
                              {branch.code ? (
                                <p className='text-xs text-muted-foreground'>{branch.code}</p>
                              ) : null}
                            </div>
                            <Checkbox
                              checked={(field.value || []).includes(branch.id)}
                              onCheckedChange={(checked) => toggleBranchSelection(branch.id, checked)}
                            />
                          </label>
                        ))
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
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

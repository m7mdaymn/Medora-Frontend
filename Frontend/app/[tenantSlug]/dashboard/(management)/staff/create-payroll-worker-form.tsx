'use client'

import { getBranchesAction } from '@/actions/branch/branches'
import { createPayrollOnlyWorkerAction } from '@/actions/staff/create-staff'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { ROLE_CONFIG, ROLES } from '@/config/roles'
import { IBranch } from '@/types/branch'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { Loader2, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  CreatePayrollWorkerInput,
  createPayrollWorkerSchema,
} from '../../../../../validation/staff'

interface Props {
  tenantSlug: string
  onSuccess: () => void
}

export function CreatePayrollWorkerForm({ tenantSlug, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<IBranch[]>([])
  const [isLoadingBranches, setIsLoadingBranches] = useState(true)

  const form = useForm<CreatePayrollWorkerInput>({
    resolver: valibotResolver(createPayrollWorkerSchema),
    defaultValues: {
      name: '',
      role: '',
      phone: '',
      salary: 0,
      notes: '',
      hireDate: new Date().toISOString().split('T')[0],
      branchIds: [],
    },
  })

  useEffect(() => {
    let isMounted = true

    const loadBranches = async () => {
      setIsLoadingBranches(true)
      const res = await getBranchesAction(tenantSlug, false)

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
  }, [tenantSlug])

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

  async function onSubmit(values: CreatePayrollWorkerInput) {
    setLoading(true)
    const res = await createPayrollOnlyWorkerAction(values, tenantSlug)
    setLoading(false)

    if (res.success) {
      toast.success(res.message)
      form.reset()
      onSuccess()
      return
    }

    toast.error(res.message)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
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
                  {[ROLES.CLINIC_MANAGER, ROLES.RECEPTIONIST, ROLES.NURSE, ROLES.WORKER].map(
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
                    onChange={(event) => {
                      const value = event.target.valueAsNumber
                      field.onChange(Number.isNaN(value) ? 0 : value)
                    }}
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
                <Input type='date' {...field} value={field.value || ''} />
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
                        form.setValue('branchIds', [], { shouldDirty: true, shouldValidate: true })
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
            <UserPlus className='mr-2 h-4 w-4' />
          )}
          إضافة العامل بدون حساب
        </Button>
      </form>
    </Form>
  )
}

'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { Loader2, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { getBranchesAction } from '@/actions/branch/branches'
import { IBranch } from '@/types/branch'
import { addExpenseAction } from '../../../../../actions/finance/expenses'
import { CreateExpenseInput, CreateExpenseSchema } from '../../../../../validation/expense'

export function AddExpenseDialog({ tenantSlug }: { tenantSlug: string }) {
  const [open, setOpen] = useState(false)
  const [branches, setBranches] = useState<IBranch[]>([])
  const [isBranchesLoading, setIsBranchesLoading] = useState(false)

  // 1. ربطنا RHF بـ Valibot Schema
  const form = useForm<CreateExpenseInput>({
    resolver: valibotResolver(CreateExpenseSchema),
    defaultValues: {
      branchId: '',
      category: '',
      amount: 0,
      expenseDate: new Date().toISOString().split('T')[0], // تاريخ النهاردة كـ Default
      notes: '',
    },
  })

  useEffect(() => {
    if (!open) return

    let active = true

    const loadBranches = async () => {
      setIsBranchesLoading(true)
      try {
        const response = await getBranchesAction(tenantSlug, false)

        if (!active) return

        if (!response.success) {
          setBranches([])
          return
        }

        const activeBranches = (response.data ?? []).filter((branch) => branch.isActive)
        setBranches(activeBranches)

        const currentBranchId = form.getValues('branchId')
        const hasCurrentBranch = currentBranchId
          ? activeBranches.some((branch) => branch.id === currentBranchId)
          : false

        if (!hasCurrentBranch) {
          form.setValue('branchId', activeBranches[0]?.id ?? '', { shouldDirty: false })
        }
      } finally {
        if (active) {
          setIsBranchesLoading(false)
        }
      }
    }

    void loadBranches()

    return () => {
      active = false
    }
  }, [open, tenantSlug, form])

  // 2. دالة الـ Submit (التايب بتاع data مستنتج أوتوماتيك من الـ Schema)
  const onSubmit = async (data: CreateExpenseInput) => {
    if (!data.branchId?.trim()) {
      toast.error('برجاء اختيار الفرع')
      return
    }

    const res = await addExpenseAction(tenantSlug, data)

    if (res.success) {
      toast.success('تم تسجيل المصروف بنجاح')
      form.reset() // تصفير الفورم بعد النجاح
      setOpen(false) // قفل المودال
    } else {
      toast.error(res.message || 'حدث خطأ أثناء الحفظ')
    }
  }

  // عشان نصفر الفورم لو اليوزر قفل المودال بدون حفظ
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) form.reset()
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className='mr-2 h-4 w-4' /> إضافة مصروف
        </Button>
      </DialogTrigger>

      <DialogContent dir='rtl'>
        <DialogHeader>
          <DialogTitle>تسجيل مصروف جديد</DialogTitle>
        </DialogHeader>

        {/* 3. تغليف الفورم بـ Shadcn Form Component */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 py-4'>
            <FormField
              control={form.control}
              name='branchId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='font-bold'>الفرع</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    disabled={isBranchesLoading || branches.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={isBranchesLoading ? 'جاري تحميل الفروع...' : 'اختر الفرع'}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
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
              name='category'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='font-bold'>البند (النوع)</FormLabel>
                  <FormControl>
                    <Input placeholder='مثال: إيجار، مستهلكات، بوفيه' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='amount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='font-bold'>المبلغ (ج.م)</FormLabel>
                    <FormControl>
                      {/* لاحظ الـ onChange عشان نحول الـ String اللي طالع من الـ Input لـ Number */}
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

              <FormField
                control={form.control}
                name='expenseDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='font-bold'>تاريخ المصروف</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='font-bold'>ملاحظات إضافية (اختياري)</FormLabel>
                  <FormControl>
                    {/* القيمة ممكن تكون undefined فبنحط '' كـ Fallback للـ Input */}
                    <Input placeholder='أي تفاصيل أخرى...' {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2 pt-4'>
              <Button type='button' variant='outline' onClick={() => handleOpenChange(false)}>
                إلغاء
              </Button>
              <Button type='submit' disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                حفظ المصروف
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

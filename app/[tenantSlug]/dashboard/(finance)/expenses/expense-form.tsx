'use client'

import { useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { Loader2 } from 'lucide-react'
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
import { ExpenseInput, ExpenseSchema } from '@/validation/expense'

interface Props {
  initialData?: ExpenseInput
  onSubmit: (data: ExpenseInput) => Promise<void>
  isSubmitting: boolean
}

export function ExpenseForm({ initialData, onSubmit, isSubmitting }: Props) {
  const form = useForm<ExpenseInput>({
    resolver: valibotResolver(ExpenseSchema),
    defaultValues: initialData || {
      category: '',
      amount: 0,
      expenseDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5 py-2' dir='rtl'>
        <FormField
          control={form.control}
          name='category'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='font-bold'>البند</FormLabel>
              <FormControl>
                <Input placeholder='إيجار، مستلزمات...' {...field} />
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
                <FormLabel className='font-bold'>المبلغ</FormLabel>
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
            name='expenseDate'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='font-bold'>التاريخ</FormLabel>
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
              <FormLabel className='font-bold'>ملاحظات</FormLabel>
              <FormControl>
                <Input placeholder='تفاصيل إضافية...' {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' className='w-full font-bold' disabled={isSubmitting}>
          {isSubmitting && <Loader2 className='ml-2 h-4 w-4 animate-spin' />} حفظ البيانات
        </Button>
      </form>
    </Form>
  )
}

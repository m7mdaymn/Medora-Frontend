'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { Edit, Loader2, MoreHorizontal, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import {
  deleteClinicServiceAction,
  updateClinicServiceAction,
} from '@/actions/service/clinic-services'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { IClinicService } from '@/types/services'
import { ClinicServiceInput, ClinicServiceSchema } from '@/validation/services'

interface Props {
  service: IClinicService
  tenantSlug: string
}

export function ServiceRowActions({ service, tenantSlug }: Props) {
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm({
    resolver: valibotResolver(ClinicServiceSchema),
    defaultValues: {
      name: service.name,
      description: service.description || '',
      defaultPrice: service.defaultPrice,
      defaultDurationMinutes: service.defaultDurationMinutes,
      isActive: service.isActive,
    },
  })

  const onEditSubmit = async (values: ClinicServiceInput) => {
    try {
      const result = await updateClinicServiceAction(tenantSlug, service.id, values)
      if (result.success) {
        toast.success('تم التعديل بنجاح')
        setIsEditOpen(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع')
    }
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteClinicServiceAction(tenantSlug, service.id)
      if (result.success) {
        toast.success('تم الحذف بنجاح')
        setIsDeleteOpen(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <>
      {/* 🔴 زرار الـ 3 نقط (Dropdown Menu) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>فتح القائمة</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='text-right'>
          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => setIsEditOpen(true)}
            className='cursor-pointer flex items-center gap-2'
          >
            <Edit className='h-4 w-4 text-muted-foreground' />
            تعديل الخدمة
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => setIsDeleteOpen(true)}
            className='cursor-pointer flex items-center gap-2 text-destructive focus:text-destructive font-medium'
          >
            <Trash2 className='h-4 w-4' />
            حذف الخدمة
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* مودال التعديل */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className='sm:max-w-125' dir='rtl'>
          <DialogHeader>
            <DialogTitle>تعديل الخدمة</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الخدمة</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='defaultPrice'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعر (ج.م)</FormLabel>
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
                  name='defaultDurationMinutes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدة (دقائق)</FormLabel>
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
              </div>
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف</FormLabel>
                    <FormControl>
                      <Textarea className='resize-none' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem className='flex items-center justify-between border p-3 rounded-lg'>
                    <FormLabel>الحالة</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} dir='ltr' />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type='submit'
                className='w-full font-bold'
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}{' '}
                حفظ التعديلات
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* أليرت الحذف */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent dir='rtl'>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              لن يمكنك التراجع عن هذا الإجراء، وسيتم حذف الخدمة من النظام.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className='bg-destructive hover:bg-destructive/90 font-bold'
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
              ) : (
                <Trash2 className='h-4 w-4 mr-2' />
              )}
              نعم، احذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

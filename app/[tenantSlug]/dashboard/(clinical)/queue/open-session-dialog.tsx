'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { mutate } from 'swr' // <--- الاستيراد السحري

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import { openQueueSession } from '@/actions/queue/sessions'
import { IDoctor } from '@/types/doctor'
import { IQueueBoardSession } from '@/types/queue'
import { OpenSessionSchema, type OpenSessionInput } from '@/validation/queue'

interface OpenSessionDialogProps {
  tenantSlug: string
  doctors: IDoctor[]
  activeSessions: IQueueBoardSession[]
}

export function OpenSessionDialog({ tenantSlug, doctors, activeSessions }: OpenSessionDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<OpenSessionInput>({
    resolver: valibotResolver(OpenSessionSchema),
    defaultValues: { notes: '' },
  })

  const availableDoctors = React.useMemo(() => {
    const activeDoctorIds = new Set(activeSessions.map((s) => s.doctorId))
    return doctors.filter((doc) => doc.isEnabled && !activeDoctorIds.has(doc.id))
  }, [doctors, activeSessions])

  async function onSubmit(values: OpenSessionInput) {
    setIsSubmitting(true)
    const res = await openQueueSession(tenantSlug, values)
    setIsSubmitting(false)

    if (res.success) {
      toast.success('تم فتح العيادة بنجاح')
      setOpen(false)
      form.reset()

      // 🔥 تحديث الشاشة فورا
      await mutate(['queueBoard', tenantSlug])
    } else {
      toast.error(res.message || 'فشل فتح العيادة')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='soft'>فتح شفت</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='font-bold text-xl'>تفعيل عيادة طبيب</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='doctorId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الطبيب المتاح</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className='h-11'>
                        <SelectValue placeholder='اختر الطبيب الذي بدأ العمل...' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableDoctors.length > 0 ? (
                        availableDoctors.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            د. {doc.name} ({doc.specialty})
                          </SelectItem>
                        ))
                      ) : (
                        <p className='p-2 text-sm text-center text-muted-foreground'>
                          كل الأطباء لديهم عيادات مفتوحة حالياً
                        </p>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات الشفت (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea placeholder='مثال: دكتور بديل، تأخير ٣٠ دقيقة...' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type='submit'
              className='w-full'
              disabled={isSubmitting || availableDoctors.length === 0}
            >
              {isSubmitting ? <Loader2 className='animate-spin' /> : 'بدء الشفت'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

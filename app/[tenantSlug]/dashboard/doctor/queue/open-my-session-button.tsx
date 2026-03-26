'use client'

import { openMySessionAction } from '@/actions/queue/open-my-session'
import { Button } from '@/components/ui/button'
import { Loader2, PlayCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { mutate } from 'swr' // 👈 استيراد الـ mutate العالمي

interface Props {
  tenantSlug: string
}

export function OpenMySessionButton({ tenantSlug }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter()

  const handleOpenSession = async () => {
    setIsLoading(true)
    const res = await openMySessionAction(tenantSlug)
    setIsLoading(false)

    if (res.success) {
      toast.success('تم فتح العيادة بنجاح')

      // 🔥 السحر هنا: بنجبر كل الـ Keys المرتبطة بالطابور إنها تتحدث فوراً
      // ده هيخلي شاشة الدكتور تقلب "نشط" وشاشة الريسبشن تظهر الدكتور في ثانية واحدة
      await Promise.all([mutate(['doctorQueue', tenantSlug]), mutate(['queueBoard', tenantSlug])])

      router.refresh()
    } else {
      toast.error(res.message || 'فشل في فتح الجلسة')
    }
  }

  return (
    <Button onClick={handleOpenSession} disabled={isLoading} size='lg'>
      {isLoading ? (
        <Loader2 className='w-5 h-5 ml-2 animate-spin' />
      ) : (
        <PlayCircle className='w-5 h-5 ml-2' />
      )}
      {isLoading ? 'جاري الفتح...' : 'افتح عيادتي الآن'}
    </Button>
  )
}

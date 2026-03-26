'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IDoctor } from '@/types/doctor'
import { IClinicService, IDoctorServiceLink } from '@/types/services'
import { Edit, Link2Off } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { deleteDoctorLinkAction } from '@/actions/service/doctor-services'
import { DoctorSelect } from './doctor-select'
import { LinkServiceModal } from './link-service-modal'

interface Props {
  tenantSlug: string
  doctors: IDoctor[]
  catalogServices: IClinicService[]
  currentLinks: IDoctorServiceLink[]
  selectedDoctorId: string | undefined
}

export function DoctorServicesView({
  tenantSlug,
  doctors,
  catalogServices,
  currentLinks,
  selectedDoctorId,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // تحديث الـ URL لما نختار دكتور تاني
  const handleDoctorChange = (doctorId: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('doctorId', doctorId)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // فك الربط (حذف اللينك)
  const handleUnlink = (clinicServiceId: string) => {
    if (!confirm('هل أنت متأكد من فك ارتباط هذه الخدمة عن الطبيب؟')) return

    startTransition(async () => {
      const res = await deleteDoctorLinkAction(tenantSlug, selectedDoctorId!, clinicServiceId)
      if (res.success) {
        toast.success('تم فك ارتباط الخدمة بنجاح')
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  // تفلتر الكتالوج عشان منعرضش الخدمات اللي مربوطة أصلًا في المودال بتاع (إضافة جديد)
  const availableServicesToLink = catalogServices.filter(
    (catSvc) => !currentLinks.some((link) => link.clinicServiceId === catSvc.id),
  )

  return (
    <div className='space-y-6' dir='rtl'>
    

      <div className='max-w-md'>
        <DoctorSelect
          doctors={doctors}
          selectedId={selectedDoctorId || ''}
          onSelect={handleDoctorChange}
        />
      </div>

      {selectedDoctorId ? (
        <div className='rounded-xl border bg-card overflow-hidden mt-6'>
          <div className='p-4 border-b flex justify-between items-center bg-muted/10'>
            <h3 className='font-bold'>الخدمات المربوطة بالطبيب</h3>
            {availableServicesToLink.length > 0 ? (
              <LinkServiceModal
                tenantSlug={tenantSlug}
                doctorId={selectedDoctorId}
                catalogServices={availableServicesToLink}
              />
            ) : (
              <Badge variant='outline'>كل الخدمات مربوطة</Badge>
            )}
          </div>

          <Table>
            <TableHeader className='bg-muted/50'>
              <TableRow>
                <TableHead className='text-right'>الخدمة</TableHead>
                <TableHead className='text-right'>السعر الفعلي (النهائي)</TableHead>
                <TableHead className='text-right'>المدة الفعلية</TableHead>
                <TableHead className='text-right'>الحالة</TableHead>
                <TableHead className='text-left'>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentLinks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='h-32 text-center text-muted-foreground'>
                    لم يتم ربط أي خدمات بهذا الطبيب بعد.
                  </TableCell>
                </TableRow>
              ) : (
                currentLinks.map((link) => (
                  <TableRow key={link.linkId} className='hover:bg-muted/30'>
                    <TableCell className='font-bold'>
                      {link.serviceName}
                      {link.overridePrice !== null && (
                        <Badge variant='secondary' className='ml-2 text-[10px]'>
                          تسعير خاص
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className='font-mono font-bold text-primary'>
                        {link.effectivePrice} ج.م
                      </span>
                      {link.overridePrice !== null && (
                        <span className='text-[10px] text-muted-foreground block line-through'>
                          الافتراضي:{' '}
                          {catalogServices.find((s) => s.id === link.clinicServiceId)?.defaultPrice}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {link.effectiveDurationMinutes} د
                    </TableCell>
                    <TableCell>
                      {link.isActive ? (
                        <Badge className='bg-emerald-100 text-emerald-700 border-0'>مفعلة</Badge>
                      ) : (
                        <Badge variant='destructive'>موقوفة</Badge>
                      )}
                    </TableCell>
                    <TableCell className='text-left'>
                      <div className='flex items-center justify-end gap-2'>
                        {/* 🔴 مودال التعديل للينك ده تحديداً */}
                        <LinkServiceModal
                          tenantSlug={tenantSlug}
                          doctorId={selectedDoctorId}
                          catalogServices={catalogServices} // بنباصي الكتالوج كله عشان يجيب منه الافتراضي
                          existingLink={link}
                        >
                          <Button variant='ghost' size='icon'>
                            <Edit className='h-4 w-4 text-muted-foreground hover:text-primary' />
                          </Button>
                        </LinkServiceModal>

                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleUnlink(link.clinicServiceId)}
                          disabled={isPending}
                        >
                          <Link2Off className='h-4 w-4 text-muted-foreground hover:text-destructive' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className='p-12 text-center border rounded-xl border-dashed mt-6 bg-muted/5'>
          <p className='text-muted-foreground'>يرجى اختيار طبيب من القائمة لعرض خدماته وإدارتها.</p>
        </div>
      )}
    </div>
  )
}

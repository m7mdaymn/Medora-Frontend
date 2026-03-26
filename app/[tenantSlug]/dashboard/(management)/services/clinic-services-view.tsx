'use client'

import { GenericPagination } from '@/components/shared/pagination'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IPaginatedData } from '@/types/api'
import { IClinicService } from '@/types/services'

import { ServiceRowActions } from './service-row-actions'

interface Props {
  paginatedData: IPaginatedData<IClinicService> | null
  tenantSlug: string
}

export function ClinicServicesView({ paginatedData, tenantSlug }: Props) {
  const services = paginatedData?.items || []

  return (
    <div className='space-y-6' dir='rtl'>
      <div className='rounded-xl border bg-card overflow-hidden'>
        <Table>
          <TableHeader className='bg-muted/50'>
            <TableRow>
              <TableHead className='text-right'>اسم الخدمة</TableHead>
              <TableHead className='text-right'>السعر الافتراضي</TableHead>
              <TableHead className='text-right'>المدة التقريبية</TableHead>
              <TableHead className='text-right'>الحالة</TableHead>
              <TableHead className='text-left w-24'>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='h-32 text-center text-muted-foreground'>
                  لا توجد خدمات مضافة حتى الآن.
                </TableCell>
              </TableRow>
            ) : (
              services.map((svc) => (
                <TableRow key={svc.id} className='hover:bg-muted/30'>
                  <TableCell className='font-bold'>{svc.name}</TableCell>
                  <TableCell className='font-mono text-primary font-bold'>
                    {svc.defaultPrice} ج.م
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {svc.defaultDurationMinutes} دقيقة
                  </TableCell>
                  <TableCell>
                    {svc.isActive ? (
                      <Badge className='bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0'>
                        مفعلة
                      </Badge>
                    ) : (
                      <Badge variant='secondary'>غير مفعلة</Badge>
                    )}
                  </TableCell>
                  <TableCell className='text-left'>
                    <ServiceRowActions service={svc} tenantSlug={tenantSlug} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {paginatedData && paginatedData.totalPages > 1 && (
        <div className='p-4 border-t bg-muted/10 mt-4 rounded-xl border'>
          <GenericPagination
            currentPage={paginatedData.pageNumber}
            totalPages={paginatedData.totalPages}
            hasNextPage={paginatedData.hasNextPage}
            hasPreviousPage={paginatedData.hasPreviousPage}
          />
        </div>
      )}
    </div>
  )
}

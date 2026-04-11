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
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Power } from 'lucide-react'
import { IStaleVisit } from '../../types/visit'

interface StaleVisitsTableProps {
  visits: IStaleVisit[]
  onCloseVisit: (visitId: string) => void
  isPending: boolean
}

export function StaleVisitsTable({ visits, onCloseVisit, isPending }: StaleVisitsTableProps) {
  return (
    <div className='rounded-md border bg-card'>
      <Table className='text-right'>
        <TableHeader className='bg-muted/50'>
          <TableRow>
            <TableHead className='text-right'>المريض</TableHead>
            <TableHead className='text-right'>الطبيب</TableHead>
            <TableHead className='text-center'>مدة التعليق</TableHead>
            <TableHead className='text-right'>بدأت في</TableHead>
            <TableHead className='text-left'>الإجراء</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visits.map((visit) => (
            <TableRow key={visit.visitId} className='hover:bg-muted/30 transition-colors'>
              {/* 1. بيانات المريض */}
              <TableCell>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>{visit.patientName}</span>
                </div>
              </TableCell>

              {/* 2. بيانات الدكتور */}
              <TableCell>
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <span>د. {visit.doctorName}</span>
                </div>
              </TableCell>

              {/* 3. تنبيه بصري بناءً على الساعات */}
              <TableCell className='text-center'>
                <Badge className='gap-1' variant={'outline'}>
                  {Number(visit.ageHours).toFixed()} ساعة
                </Badge>
              </TableCell>

              {/* 4. وقت البداية منسق */}
              <TableCell className='text-muted-foreground text-xs'>
                {format(new Date(visit.startedAt), 'p - dd MMM', { locale: ar })}
              </TableCell>

              {/* 5. زرار الأكشن الإداري */}
              <TableCell className='text-left'>
                <Button
                  variant='ghost'
                  size='icon-sm'
                  className='text-destructive hover:bg-destructive/10'
                  disabled={isPending}
                  onClick={() => onCloseVisit(visit.visitId)}
                  title='إغلاق إجباري'
                >
                  <Power className='size-4' />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

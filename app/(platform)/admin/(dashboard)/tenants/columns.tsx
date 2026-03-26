'use client'

import { Badge } from '@/components/ui/badge'
import { ITenant } from '@/types/platform'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { TenantActions } from './tenant-actions'

// 100% Type-Safe without any/unknown
export const columns: ColumnDef<ITenant>[] = [
  {
    accessorKey: 'name',
    header: 'اسم العيادة',
    cell: ({ row }) => <div className='font-bold'>{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'slug',
    header: 'المعرف (Slug)',
    cell: ({ row }) => (
      <span className='font-mono text-sm text-muted-foreground bg-muted/20 px-2 py-1 rounded inline-block'>
        {row.getValue('slug')}
      </span>
    ),
  },
  {
    accessorKey: 'contactPhone',
    header: 'رقم التواصل',
    cell: ({ row }) => (
      <div dir='ltr' className='text-right text-muted-foreground'>
        {row.getValue('contactPhone') || '—'}
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'تاريخ الانضمام',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return format(date, 'dd MMMM yyyy', { locale: ar })
    },
  },
  {
    accessorKey: 'status',
    header: 'الحالة',
    cell: ({ row }) => {
      const status = row.getValue('status')
      // 0=Active, 1=Suspended, 2=Blocked, 3=Inactive
      if (status === 0 || status === 'Active') {
        return <Badge className='bg-green-500 text-white'>نشط</Badge>
      }
      if (status === 1 || status === 'Suspended') {
        return <Badge className='bg-yellow-500 text-white'>موقوف</Badge>
      }
      if (status === 2 || status === 'Blocked') {
        return <Badge variant='destructive'>محظور</Badge>
      }
      if (status === 3 || status === 'Inactive') {
        return <Badge variant='secondary'>غير نشط</Badge>
      }
      return <Badge variant='outline'>مجهول</Badge>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return <TenantActions tenant={row.original} />
    },
  },
]

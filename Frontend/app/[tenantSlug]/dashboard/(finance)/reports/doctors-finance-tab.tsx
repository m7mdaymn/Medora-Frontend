import { getFinanceByDoctorAction } from '@/actions/finance/reports'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Stethoscope } from 'lucide-react'
import { DoctorDateFilter } from './doctor-date-filter'

export async function DoctorsFinanceTab({
  tenantSlug,
  date,
}: {
  tenantSlug: string
  date?: string
}) {
  const targetDate = date || new Date().toISOString().split('T')[0]
  const response = await getFinanceByDoctorAction(tenantSlug, targetDate)
  const doctors = response?.data || []

  return (
    <div className='space-y-8 animate-in fade-in duration-500'>
      {/* Header Area */}
      <div className='flex flex-col sm:flex-row border-b border-border/40 pb-4 sm:items-center justify-between gap-4'>
        <h3 className='text-lg font-black tracking-tight'>أرباح الأطباء ليوم محدد</h3>

        <DoctorDateFilter currentDate={targetDate} />
      </div>

      {/* Table Container */}
      <div className='border border-border/50 rounded-2xl  overflow-hidden shadow-sm'>
        <Table dir='rtl'>
          <TableHeader className='bg-muted/20'>
            <TableRow className='hover:bg-transparent border-border/40'>
              <TableHead className='h-11 text-xs font-semibold text-muted-foreground'>
                اسم الطبيب
              </TableHead>
              <TableHead className='h-11 text-xs font-semibold text-muted-foreground text-center'>
                الكشوفات
              </TableHead>
              <TableHead className='h-11 text-xs font-semibold text-muted-foreground text-left'>
                الإيراد الكلي
              </TableHead>
              <TableHead className='h-11 text-xs font-semibold text-muted-foreground text-left'>
                المحصل الفعلي
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className='h-32 text-center text-muted-foreground'>
                  <div className='flex flex-col items-center justify-center gap-2 opacity-60'>
                    <Stethoscope className='size-8' />
                    <span className='text-sm font-medium'>
                      لا توجد كشوفات مسجلة للأطباء في هذا اليوم
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              doctors.map((doc) => (
                <TableRow
                  key={doc.doctorId}
                  className='hover:bg-muted/5 border-border/30 transition-colors'
                >
                  <TableCell className='py-4 font-bold text-sm text-foreground'>
                    د. {doc.doctorName}
                  </TableCell>

                  <TableCell className='py-4 text-center'>
                    <span className='inline-flex items-center justify-center px-2.5 py-1 text-xs font-mono font-bold bg-muted/50 border border-border/50 rounded-lg'>
                      {doc.visitCount}
                    </span>
                  </TableCell>

                  <TableCell className='py-4 text-left'>
                    <div className='flex items-baseline justify-end gap-1'>
                      <span className='font-mono font-medium text-sm text-muted-foreground'>
                        {doc.totalPaid.toLocaleString()}
                      </span>
                      <span className='text-[10px] font-bold text-muted-foreground/50'>ج.م</span>
                    </div>
                  </TableCell>

                  <TableCell className='py-4 text-left'>
                    <div className='flex items-baseline justify-end gap-1'>
                      <span className='font-mono font-bold text-sm text-foreground'>
                        {doc.totalRevenue.toLocaleString()}
                      </span>
                      <span className='text-[10px] font-bold text-muted-foreground/70'>ج.م</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

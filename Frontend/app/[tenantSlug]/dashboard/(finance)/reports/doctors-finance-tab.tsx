import { getFinanceByDoctorAction } from '@/actions/finance/reports'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export async function DoctorsFinanceTab({
  tenantSlug,
  date,
}: {
  tenantSlug: string
  date?: string
}) {
  // لو مفيش تاريخ مبعوت، هنجيب إيرادات الدكاترة لليوم الحالي
  const targetDate = date || new Date().toISOString().split('T')[0]

  const response = await getFinanceByDoctorAction(tenantSlug, targetDate)
  const doctors = response?.data || []

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-black tracking-tight'>حسابات الأطباء التفصيلية (يومي)</h3>
        {/* ملحوظة: هنا يفضل تحط كومبوننت DatePicker بيغير الـ ?date= في الـ URL */}
        <div className='text-sm font-bold bg-muted px-4 py-2 rounded-md'>
          تاريخ: {new Date(targetDate).toLocaleDateString('ar-EG')}
        </div>
      </div>

      <div className='overflow-hidden border rounded-md'>
        <Table dir='rtl'>
          <TableHeader className='bg-muted/50 h-12'>
            <TableRow>
              <TableHead className='font-bold text-right'>اسم الطبيب</TableHead>
              <TableHead className='font-bold text-right'>عدد الكشوفات</TableHead>
              <TableHead className='font-bold text-right'>الإيراد الكلي</TableHead>
              <TableHead className='font-bold text-right'>المحصل الفعلي (كاش)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className='h-24 text-center text-muted-foreground font-medium'
                >
                  لا توجد كشوفات مسجلة للأطباء في هذا اليوم
                </TableCell>
              </TableRow>
            ) : (
              doctors.map((doc) => (
                <TableRow key={doc.doctorId}>
                  <TableCell className='font-bold'>{doc.doctorName}</TableCell>
                  <TableCell className='font-mono'>{doc.visitCount}</TableCell>
                  <TableCell className='font-bold text-muted-foreground'>
                    {doc.totalRevenue} ج.م
                  </TableCell>
                  <TableCell className='text-primary font-black'>{doc.totalPaid} ج.م</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { IDoctorProfit, IYearlyFinance } from '../../types/finance'

interface DashboardChartsProps {
  yearlyData: IYearlyFinance
  doctorsData: IDoctorProfit[]
}

const barChartConfig = {
  revenue: { label: 'الإيرادات', color: 'var(--chart-1)' },
  paid: { label: 'المحصل', color: 'var(--chart-2)' },
} satisfies ChartConfig

const pieChartConfig = {
  revenue: { label: 'إجمالي الدخل' },
} satisfies ChartConfig

const arabicMonths = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

export function DashboardCharts({ yearlyData, doctorsData }: DashboardChartsProps) {
  const formattedMonthlyData = yearlyData.months.map((m) => ({
    name: arabicMonths[m.month - 1] || m.month.toString(),
    revenue: m.totalRevenue,
    paid: m.totalPaid,
  }))

  const formattedDoctorsData = doctorsData.map((doc, index) => ({
    name: doc.doctorName,
    revenue: doc.totalRevenue,
    fill: `var(--chart-${(index % 5) + 1})`,
  }))

  return (
    <div className='grid gap-4 grid-cols-1 lg:grid-cols-7 mt-4'>
      {/* رسمة الإيرادات الشهرية */}
      {/* التريكة هنا في min-w-0 عشان تمنع الـ Grid Blowout على الموبايل */}
      <Card className='col-span-1 lg:col-span-4 shadow-sm border-border/50 min-w-0'>
        <CardHeader>
          <CardTitle className='text-lg md:text-xl'>تحليل الإيرادات ({yearlyData.year})</CardTitle>
          <CardDescription className='text-xs md:text-sm'>
            مقارنة بين إجمالي الإيرادات والمبالغ المحصلة فعلياً
          </CardDescription>
        </CardHeader>
        <CardContent className='p-2 sm:p-6 sm:pt-0'>
          <ChartContainer config={barChartConfig} className='h-62.5 md:h-75 w-full'>
            {/* استخدام ResponsiveContainer إجباري عشان يعيد الحسابات مع تغيير حجم الشاشة */}
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={formattedMonthlyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='hsl(var(--border))' />
                <XAxis
                  dataKey='name'
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  minTickGap={15} // بيخفي الشهور اللي هتدخل في بعض على الموبايل
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  width={50}
                />
                <ChartTooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                  content={<ChartTooltipContent indicator='dashed' />}
                />
                <Bar
                  dataKey='revenue'
                  fill='var(--color-revenue)'
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey='paid'
                  fill='var(--color-paid)'
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* رسمة أداء الأطباء */}
      <Card className='col-span-1 lg:col-span-3 shadow-sm border-border/50 min-w-0'>
        <CardHeader>
          <CardTitle className='text-lg md:text-xl'>أداء الأطباء</CardTitle>
          <CardDescription className='text-xs md:text-sm'>
            توزيع الإيرادات حسب كل طبيب اليوم
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center p-2 sm:p-6 sm:pt-0'>
          {formattedDoctorsData.length > 0 ? (
            <ChartContainer config={pieChartConfig} className='h-50 md:h-62.5 w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent indicator='line' />} />
                  <Pie
                    data={formattedDoctorsData}
                    dataKey='revenue'
                    nameKey='name'
                    cx='50%'
                    cy='50%'
                    // تحويل الرادياس لنسب مئوية عشان تكبر وتصغر مع مساحة الشاشة بنعومة
                    innerRadius='55%'
                    outerRadius='80%'
                    paddingAngle={3}
                    stroke='none'
                  >
                    {formattedDoctorsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className='h-50 md:h-62.5 flex items-center justify-center text-muted-foreground text-sm'>
              لا توجد إيرادات مسجلة للأطباء اليوم.
            </div>
          )}

          {/* مفتاح الرسم البياني - Responsive Wrap */}
          <div className='flex flex-wrap justify-center gap-3 md:gap-4 mt-4'>
            {formattedDoctorsData.map((doc, i) => (
              <div
                key={i}
                className='flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground font-medium'
              >
                <span
                  className='w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shrink-0'
                  style={{ backgroundColor: doc.fill }}
                />
                <span className='truncate max-w-20 sm:max-w-30'>{doc.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

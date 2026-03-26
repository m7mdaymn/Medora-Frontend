import { DashboardHeader, DashboardShell } from '../../../../../components/shell'
import { DoctorsFinanceTab } from './doctors-finance-tab'
import { FinanceTabsNavigation } from './finance-tabs-navigation'
import { OverviewTab } from './overview-tab'
import { YearlyFinanceTab } from './yearly-finance-tab'

export default async function FinanceReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>
  // ضفنا date و year هنا عشان التابات الجديدة
  searchParams: Promise<{ tab?: string; from?: string; to?: string; date?: string; year?: string }>
}) {
  const { tenantSlug } = await params
  const { tab = 'overview', from, to, date, year } = await searchParams

  return (
    <DashboardShell>
      <DashboardHeader
        heading='التقارير المالية'
        text='نظرة شاملة على أرباح العيادة وحسابات الأطباء'
      />

      {/* الـ Prop اتمسح من هنا زي ما اتفقنا */}
      <FinanceTabsNavigation />

      <div className='mt-6'>
        {tab === 'overview' && <OverviewTab tenantSlug={tenantSlug} from={from} to={to} />}

        {tab === 'doctors' && <DoctorsFinanceTab tenantSlug={tenantSlug} date={date} />}

        {/* لاحظ إني استخدمت yearly لأننا غيرنا اسم التاب للسنوي */}
        {tab === 'monthly' && <YearlyFinanceTab tenantSlug={tenantSlug} year={year} />}
      </div>
    </DashboardShell>
  )
}

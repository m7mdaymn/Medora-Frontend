import { DashboardHeader, DashboardShell } from '../../../../../components/shell'
import { DoctorsFinanceTab } from './doctors-finance-tab'
import { FinanceTabsNavigation } from './finance-tabs-navigation'
import { OverviewTab } from './overview-tab'
import { ServicesSalesTab } from './services-sales-tab'
import { YearlyFinanceTab } from './yearly-finance-tab'

export default async function FinanceReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ tab?: string; from?: string; to?: string; date?: string; year?: string }>
}) {
  const { tenantSlug } = await params
  const { tab = 'overview', from, to, date, year } = await searchParams

  return (
    <DashboardShell>
      <DashboardHeader
        heading='التقارير المالية'
        text='نظرة شاملة على أرباح العيادة وحسابات الأطباء'
      >
        <FinanceTabsNavigation />
      </DashboardHeader>

      <div >
        {tab === 'overview' && <OverviewTab tenantSlug={tenantSlug} from={from} to={to} />}

        {tab === 'doctors' && <DoctorsFinanceTab tenantSlug={tenantSlug} date={date} />}

        {tab === 'services' && <ServicesSalesTab tenantSlug={tenantSlug} from={from} to={to} />}

        {tab === 'yearly' && <YearlyFinanceTab tenantSlug={tenantSlug} year={year} />}
      </div>
    </DashboardShell>
  )
}

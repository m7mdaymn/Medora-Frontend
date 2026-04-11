import { Button } from '@/components/ui/button'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { OverviewTab } from '../overview-tab'

export default async function AllBranchesReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { tenantSlug } = await params
  const { from, to } = await searchParams

  return (
    <DashboardShell>
      <DashboardHeader
        heading='تقارير جميع الفروع'
        text='عرض مجمع للأداء المالي والتشغيلي عبر كل فروع المنشأة'
      >
        <Button asChild variant='outline' size='sm'>
          <Link href={`/${tenantSlug}/dashboard/reports?tab=overview`} className='gap-2'>
            <ArrowRight className='h-4 w-4' />
            الرجوع لتقارير الفرع الحالي
          </Link>
        </Button>
      </DashboardHeader>

      <OverviewTab tenantSlug={tenantSlug} from={from} to={to} scope='all' />
    </DashboardShell>
  )
}

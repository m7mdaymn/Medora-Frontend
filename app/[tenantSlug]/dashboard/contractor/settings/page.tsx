import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings2 } from 'lucide-react'
import Link from 'next/link'

export default async function ContractorSettingsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>
}) {
  const { tenantSlug } = await params

  return (
    <DashboardShell>
      <DashboardHeader
        heading='إعدادات المتعاقد'
        text='إدارة دليل الخدمات وسياسات التسعير والتسوية.'
      />

      <Card className='rounded-2xl border-border/60'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Settings2 className='h-5 w-5 text-primary' />
            إعدادات التشغيل
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <p className='text-sm text-muted-foreground'>
            يتم ضبط الخدمات، الأسعار، نسب التسوية، وخصومات المرضى من خلال شاشة دليل الخدمات.
          </p>
          <Button asChild>
            <Link href={`/${tenantSlug}/dashboard/contractor/services`}>الانتقال إلى دليل الخدمات</Link>
          </Button>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}

import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, Link2 } from 'lucide-react'
import Link from 'next/link'

export default async function ContractorLinksPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>
}) {
  const { tenantSlug } = await params

  return (
    <DashboardShell>
      <DashboardHeader
        heading='روابط المتعاقد'
        text='روابط سريعة للطلبات، الخدمات، والصفحة العامة للمنشأة المتعاقدة.'
      />

      <Card className='rounded-2xl border-border/60'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Link2 className='h-5 w-5 text-primary' />
            روابط سريعة
          </CardTitle>
        </CardHeader>
        <CardContent className='grid gap-2 sm:grid-cols-2'>
          <Button asChild variant='outline' className='justify-between'>
            <Link href={`/${tenantSlug}/dashboard/contractor/orders`}>
              طلبات الخدمات
              <ExternalLink className='h-4 w-4' />
            </Link>
          </Button>
          <Button asChild variant='outline' className='justify-between'>
            <Link href={`/${tenantSlug}/dashboard/contractor/services`}>
              دليل الخدمات
              <ExternalLink className='h-4 w-4' />
            </Link>
          </Button>
          <Button asChild variant='outline' className='justify-between sm:col-span-2'>
            <Link href={`/${tenantSlug}`}>
              الصفحة العامة للمنشأة
              <ExternalLink className='h-4 w-4' />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}

import { getHealthAction } from '@/actions/platform/health'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, ArrowLeft, Database, ServerCrash, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

const asString = (payload: Record<string, unknown>, ...keys: string[]): string => {
  for (const key of keys) {
    if (typeof payload[key] === 'string') {
      return payload[key] as string
    }
  }

  return 'Unknown'
}

const asDate = (value: unknown): string => {
  if (typeof value !== 'string') return '—'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleString('ar-EG')
}

export default async function HealthPage() {
  const response = await getHealthAction()
  const payload = (response.data || {}) as Record<string, unknown>

  const apiStatus = asString(payload, 'status', 'Status')
  const dbStatus = asString(payload, 'database', 'Database')
  const startedAt = asDate(payload['startedAt'] ?? payload['StartedAt'])

  const statusTone =
    apiStatus.toLowerCase() === 'healthy' || apiStatus.toLowerCase() === 'ok'
      ? 'bg-emerald-500/15 text-emerald-700 border-emerald-200'
      : 'bg-rose-500/15 text-rose-700 border-rose-200'

  return (
    <div className='space-y-6'>
      <section className='flex flex-col gap-4 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>صحة النظام</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            حالة الخدمات الحرجة وبيانات الاستقرار التشغيلي من نقطة واحدة.
          </p>
        </div>

        <Button asChild variant='outline'>
          <Link href='/admin/control-tower'>
            العودة لمركز القيادة
            <ArrowLeft className='mr-2 h-4 w-4' />
          </Link>
        </Button>
      </section>

      {!response.success ? (
        <Alert variant='destructive'>
          <ServerCrash className='h-4 w-4' />
          <AlertTitle>فشل فحص الصحة</AlertTitle>
          <AlertDescription>{response.message || 'تعذر الوصول إلى فحص الصحة حالياً.'}</AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <ShieldCheck className='h-4 w-4' />
          <AlertTitle>تم جلب بيانات الصحة</AlertTitle>
          <AlertDescription>يعرض هذا التقرير آخر استجابة مباشرة من نقطة فحص الصحة.</AlertDescription>
        </Alert>
      )}

      <section className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm text-muted-foreground flex items-center justify-between'>
              حالة الـ API
              <Activity className='h-4 w-4 text-primary' />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={statusTone}>{apiStatus}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-sm text-muted-foreground flex items-center justify-between'>
              حالة قاعدة البيانات
              <Database className='h-4 w-4 text-primary' />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant='outline'>{dbStatus}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-sm text-muted-foreground'>آخر تشغيل مسجل</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm font-medium'>{startedAt}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الاستجابة الخام</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className='overflow-x-auto rounded-xl border bg-muted/20 p-3 text-xs' dir='ltr'>
            {JSON.stringify(payload, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

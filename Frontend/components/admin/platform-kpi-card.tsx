import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface PlatformKpiCardProps {
  title: string
  value: string | number
  hint?: string
  icon: LucideIcon
  accentClassName?: string
}

export function PlatformKpiCard({
  title,
  value,
  hint,
  icon: Icon,
  accentClassName,
}: PlatformKpiCardProps) {
  return (
    <Card className='relative overflow-hidden border-border/70'>
      <div className={cn('absolute top-0 right-0 h-1 w-full bg-primary/40', accentClassName)} />
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm text-muted-foreground font-medium flex items-center justify-between gap-3'>
          <span>{title}</span>
          <Icon className='h-4 w-4 text-primary' />
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-1'>
        <p className='text-2xl font-bold leading-none'>{value}</p>
        {hint ? <p className='text-xs text-muted-foreground'>{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

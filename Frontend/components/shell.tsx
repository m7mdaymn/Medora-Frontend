import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import * as React from 'react'

interface DashboardHeaderProps {
  heading: string
  text?: string
  children?: React.ReactNode
  className?: string
}

export function DashboardHeader({ heading, text, children, className }: DashboardHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-2',
        className,
      )}
    >
      <div className='grid gap-1.5'>
        <Typography variant='h2' className='text-2xl md:text-3xl'>
          {heading}
        </Typography>
        {text && <Typography variant='muted'>{text}</Typography>}
      </div>
      {children && (
        <div className='flex items-center gap-2 flex-wrap w-full md:w-auto'>{children}</div>
      )}
    </div>
  )
}

type DashboardShellProps = React.HTMLAttributes<HTMLDivElement>

export function DashboardShell({ children, className, ...props }: DashboardShellProps) {
  return (
    <div className={cn('flex flex-col gap-6 md:gap-8 h-full', className)} {...props}>
      {children}
    </div>
  )
}

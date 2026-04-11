'use client'

import Link from 'next/link'
import { MessageSquare, Phone, Smartphone } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

type SupportLink = {
  label: string
  href: string
  external?: boolean
}

interface GlobalSupportDrawerProps {
  links?: SupportLink[]
  supportPhone?: string | null
  supportWhatsApp?: string | null
  triggerLabel?: string
}

function normalizeWhatsAppNumber(phone: string): string {
  let normalized = phone.replace(/[^\d+]/g, '')

  if (normalized.startsWith('+')) {
    normalized = normalized.slice(1)
  }

  if (normalized.startsWith('00')) {
    normalized = normalized.slice(2)
  }

  if (normalized.startsWith('0')) {
    normalized = `20${normalized.slice(1)}`
  }

  return normalized.replace(/\D/g, '')
}

export function GlobalSupportDrawer({
  links = [],
  supportPhone,
  supportWhatsApp,
  triggerLabel = 'الدعم',
}: GlobalSupportDrawerProps) {
  const normalizedWhatsapp = supportWhatsApp ? normalizeWhatsAppNumber(supportWhatsApp) : ''
  const whatsappText = encodeURIComponent('مرحباً، أحتاج دعماً بخصوص النظام.')
  const whatsappUrl = normalizedWhatsapp ? `https://wa.me/${normalizedWhatsapp}?text=${whatsappText}` : null

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type='button' size='sm' variant='outline' className='gap-1.5'>
          <MessageSquare className='h-4 w-4' />
          <span className='hidden sm:inline'>{triggerLabel}</span>
        </Button>
      </SheetTrigger>

      <SheetContent side='right' className='w-full sm:max-w-md'>
        <SheetHeader className='border-b border-border/60'>
          <SheetTitle className='flex items-center gap-2'>
            <MessageSquare className='h-4 w-4 text-primary' />
            مركز الدعم السريع
          </SheetTitle>
          <SheetDescription>
            وصول مباشر لقنوات المساعدة، الرسائل، وبيانات التواصل.
          </SheetDescription>
        </SheetHeader>

        <div className='space-y-4 p-4'>
          {links.length > 0 ? (
            <div className='space-y-2'>
              {links.map((link) => (
                <Button
                  key={`${link.href}-${link.label}`}
                  asChild
                  variant='outline'
                  className='w-full justify-between'
                >
                  {link.external ? (
                    <a href={link.href} target='_blank' rel='noreferrer'>
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href}>{link.label}</Link>
                  )}
                </Button>
              ))}
            </div>
          ) : null}

          {supportPhone ? (
            <div className='rounded-xl border border-border/60 p-3'>
              <p className='text-xs text-muted-foreground mb-1'>هاتف الدعم</p>
              <p className='font-semibold flex items-center gap-2'>
                <Phone className='h-4 w-4 text-primary' />
                {supportPhone}
              </p>
            </div>
          ) : null}

          <div className='rounded-xl border border-border/60 p-3'>
            <p className='text-xs text-muted-foreground mb-1'>واتساب الدعم</p>
            <div className='flex items-center justify-between gap-3'>
              <p className='font-semibold truncate'>{supportWhatsApp || 'غير متاح حالياً'}</p>
              {whatsappUrl ? (
                <Button asChild size='sm'>
                  <a href={whatsappUrl} target='_blank' rel='noreferrer'>
                    <Smartphone className='h-4 w-4 ml-1' />
                    واتساب
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          {!links.length && !supportPhone && !whatsappUrl ? (
            <div className='rounded-xl border border-dashed border-border/60 p-3 text-sm text-muted-foreground'>
              لا توجد بيانات دعم متاحة حالياً. حدّث بيانات التواصل من الإعدادات.
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

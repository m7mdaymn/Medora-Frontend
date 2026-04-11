'use client'

import { Typography } from '@/components/ui/typography'
import {
  formatEgyptPhoneForDisplay,
  normalizeSocialUrl,
  toTelLink,
  toWhatsAppLink,
} from '@/lib/utils'
import {
  Facebook,
  Globe,
  Instagram,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  Twitter,
  Youtube,
} from 'lucide-react'
import Link from 'next/link'
import { IPublicClinic } from '../../types/public'
import { ClinicImage } from '../shared/clinic-image' // 👈 استيراد المكون الموحد
import { publicRoutes } from './navbar'

interface FooterProps {
  clinic: IPublicClinic
  tenantSlug: string
}

export default function Footer({ clinic, tenantSlug }: FooterProps) {
  const displayAddress = [clinic.city, clinic.address].filter(Boolean).join('، ')
  const socialLinks = clinic.socialLinks || {}
  const socialItems = [
    {
      key: 'website',
      href: normalizeSocialUrl(socialLinks.website),
      label: 'Website',
      Icon: Globe,
    },
    {
      key: 'instagram',
      href: normalizeSocialUrl(socialLinks.instagram),
      label: 'Instagram',
      Icon: Instagram,
    },
    {
      key: 'facebook',
      href: normalizeSocialUrl(socialLinks.facebook),
      label: 'Facebook',
      Icon: Facebook,
    },
    { key: 'x', href: normalizeSocialUrl(socialLinks.x), label: 'X', Icon: Twitter },
    {
      key: 'youtube',
      href: normalizeSocialUrl(socialLinks.youtube),
      label: 'YouTube',
      Icon: Youtube,
    },
    { key: 'tiktok', href: normalizeSocialUrl(socialLinks.tiktok), label: 'TikTok', Icon: Music2 },
  ].filter((item) => item.href)

  return (
    <footer
      className='w-full mt-20 border-t border-border/50 bg-background/80 backdrop-blur-md'
      dir='rtl'
    >
      <div className='container mx-auto px-4 md:px-8 max-w-7xl py-14 md:py-16'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14'>
          {/* العمود الأول: البراند والنبذة */}
          <div className='space-y-6'>
            <Link
              href={`/${tenantSlug}`}
              className='flex items-center gap-3 transition-opacity hover:opacity-80'
            >
              {clinic.logoUrl ? (
                /* 👈 استخدام المكون الموحد لضمان ظهور اللوجو */
                <div className='relative w-12 h-12 rounded-xl overflow-hidden bg-background border border-border shrink-0'>
                  <ClinicImage
                    src={clinic.logoUrl}
                    alt={clinic.clinicName}
                    fill
                    fallbackType='logo'
                    className='object-contain p-1'
                  />
                </div>
              ) : null}
              <Typography variant='h4' className='font-black text-foreground tracking-tight'>
                {clinic.clinicName}
              </Typography>
            </Link>
            <Typography variant='muted' className='text-sm leading-relaxed max-w-xs'>
              تجربة طبية متكاملة تبدأ من حجز الموعد وتنتهي برعاية دقيقة واهتمام بكل التفاصيل.
            </Typography>
          </div>

          {/* العمود الثاني: روابط سريعة */}
          <div className='space-y-6'>
            <Typography variant='h4' className='font-bold text-foreground text-lg'>
              الوصول السريع
            </Typography>
            <nav className='flex flex-col gap-3'>
              {publicRoutes.map((route) => (
                <Link
                  key={route.label}
                  href={`/${tenantSlug}${route.href}`}
                  className='w-fit group'
                >
                  <span className='text-sm text-muted-foreground group-hover:text-primary transition-colors'>
                    {route.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* العمود الثالث: تواصل معنا */}
          <div className='space-y-6'>
            <Typography variant='h4' className='font-bold text-foreground text-lg'>
              بيانات التواصل
            </Typography>
            <div className='flex flex-col gap-4'>
              {displayAddress && (
                <div className='flex items-start gap-3'>
                  <MapPin className='w-5 h-5 text-primary shrink-0 mt-0.5' />
                  <span className='text-sm text-muted-foreground leading-snug'>
                    {displayAddress}
                  </span>
                </div>
              )}
              {clinic.phone && (
                <a
                  href={toTelLink(clinic.phone)}
                  className='flex items-center gap-3 hover:opacity-80'
                >
                  <Phone className='w-5 h-5 text-primary shrink-0' />
                  <span className='text-sm text-muted-foreground' dir='ltr'>
                    {formatEgyptPhoneForDisplay(clinic.phone)}
                  </span>
                </a>
              )}
              {clinic.supportWhatsAppNumber && (
                <a
                  href={toWhatsAppLink(clinic.supportWhatsAppNumber)}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-3 group cursor-pointer'
                >
                  <MessageCircle className='w-5 h-5 text-[#25D366] shrink-0' />
                  <span
                    className='text-sm text-muted-foreground group-hover:text-[#25D366] transition-colors'
                    dir='ltr'
                  >
                    {formatEgyptPhoneForDisplay(clinic.supportWhatsAppNumber)}
                  </span>
                </a>
              )}
            </div>
          </div>

          {/* العمود الرابع */}
          <div className='space-y-6'>
            <Typography variant='h4' className='font-bold text-foreground text-lg'>
              قنواتنا الرسمية
            </Typography>

            {socialItems.length > 0 ? (
              <div className='grid grid-cols-3 gap-2.5'>
                {socialItems.slice(0, 6).map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    aria-label={item.label}
                    className='h-10 rounded-xl border border-border/60 bg-card hover:bg-accent transition-colors flex items-center justify-center'
                  >
                    <item.Icon className='w-4 h-4 text-primary' />
                  </a>
                ))}
              </div>
            ) : null}

            <div className='p-5 rounded-2xl bg-linear-to-br from-primary/10 to-cyan-500/10 border border-primary/20 space-y-3'>
              <Typography variant='small' className='font-bold text-primary block'>
                حالات الطوارئ
              </Typography>
              <Typography variant='muted' className='text-xs leading-relaxed'>
                في حالات الطوارئ القصوى خارج أوقات العمل الرسمية، يرجى التوجه لأقرب مستشفى أو
                الاتصال على أرقام الطوارئ المحلية.
              </Typography>
            </div>
          </div>
        </div>

        <div className='pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4'>
          <Typography variant='muted' className='text-xs text-center md:text-start font-medium'>
            &copy; {new Date().getFullYear()} {clinic.clinicName}. جميع الحقوق محفوظة.
          </Typography>

          <Typography
            variant='muted'
            className='text-[10px] text-center md:text-end opacity-70 tracking-widest uppercase'
          >
            Powered by <span className='font-bold text-foreground'>Medora</span>
          </Typography>
        </div>
      </div>
    </footer>
  )
}

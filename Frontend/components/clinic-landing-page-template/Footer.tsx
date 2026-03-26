'use client'

import { Typography } from '@/components/ui/typography'
import { MapPin, MessageCircle, Phone } from 'lucide-react'
import Link from 'next/link'
import { IPublicClinic } from '../../types/public'
import { publicRoutes } from './navbar'
import { ClinicImage } from '../shared/clinic-image' // 👈 استيراد المكون الموحد

interface FooterProps {
  clinic: IPublicClinic
  tenantSlug: string
}

export default function Footer({ clinic, tenantSlug }: FooterProps) {
  const displayAddress = [clinic.city, clinic.address].filter(Boolean).join('، ')

  return (
    <footer className='w-full bg-muted border-t-2 border-border/50 pt-16 pb-8 mt-20' dir='rtl'>
      <div className='container mx-auto px-4 md:px-8 max-w-7xl'>
        {/* شبكة الفوتر الرئيسية */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16'>
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
              نلتزم بتقديم رعاية طبية استثنائية تعتمد على أحدث التقنيات وأفضل الكفاءات لضمان تجربة
              علاجية آمنة ومريحة.
            </Typography>
          </div>

          {/* العمود الثاني: روابط سريعة */}
          <div className='space-y-6'>
            <Typography variant='h4' className='font-bold text-foreground text-lg'>
              روابط سريعة
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
              تواصل معنا
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
                <div className='flex items-center gap-3'>
                  <Phone className='w-5 h-5 text-primary shrink-0' />
                  <span className='text-sm text-muted-foreground' dir='ltr'>
                    {clinic.phone}
                  </span>
                </div>
              )}
              {clinic.supportWhatsAppNumber && (
                <div className='flex items-center gap-3 group cursor-pointer'>
                  <MessageCircle className='w-5 h-5 text-[#25D366] shrink-0' />
                  <span
                    className='text-sm text-muted-foreground group-hover:text-[#25D366] transition-colors'
                    dir='ltr'
                  >
                    {clinic.supportWhatsAppNumber}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* العمود الرابع: معلومات هامة */}
          <div className='space-y-6'>
            <Typography variant='h4' className='font-bold text-foreground text-lg'>
              معلومات هامة
            </Typography>
            <div className='p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-3'>
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

        {/* الشريط السفلي: حقوق النشر */}
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

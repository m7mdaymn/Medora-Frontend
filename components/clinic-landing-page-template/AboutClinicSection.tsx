'use client'

import { fadeInUp, staggerContainer } from '@/animation'
import { Typography } from '@/components/ui/typography'
import {
  formatEgyptPhoneForDisplay,
  normalizeSocialUrl,
  toTelLink,
  toWhatsAppLink,
} from '@/lib/utils'
import { motion } from 'framer-motion'
import { Facebook, Globe, Instagram, MapPin, Music2, Phone, Twitter, Youtube } from 'lucide-react'
import { IPublicClinic } from '../../types/public'

export default function AboutClinicSection({ clinic }: { clinic: IPublicClinic }) {
  if (!clinic) return null

  const displayAddress = [clinic.city, clinic.address].filter(Boolean).join('، ')
  const displayPhone = clinic.phone || clinic.supportWhatsAppNumber
  const formattedDisplayPhone = formatEgyptPhoneForDisplay(displayPhone)
  const formattedWhatsAppPhone = formatEgyptPhoneForDisplay(clinic.supportWhatsAppNumber)
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

  const description =
    clinic.description ||
    'نلتزم بتقديم رعاية طبية استثنائية تعتمد على أحدث التقنيات وأفضل الكفاءات. نضع صحتك وصحة أسرتك في قمة أولوياتنا لضمان تجربة علاجية آمنة ومريحة.'

  return (
    <section id='about' className='py-20 md:py-32 relative overflow-hidden bg-muted/30'>
      <motion.div
        className='container mx-auto px-4 md:px-6 flex flex-col items-center text-center relative z-10'
        variants={staggerContainer}
        initial='hidden'
        whileInView='visible'
        viewport={{ once: true, margin: '-100px' }}
      >
        {/* منطقة الهيدر */}
        <div className='max-w-4xl mb-16 md:mb-24 space-y-6'>
          <motion.div variants={fadeInUp}>
            <Typography
              variant='h2'
              className='text-4xl md:text-6xl font-black tracking-tight text-foreground'
            >
              تواصل مع
              <span className='text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60'>
                {' '}
                {clinic.clinicName}
              </span>
            </Typography>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Typography
              variant='p'
              className='text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed'
            >
              {description}
            </Typography>
          </motion.div>
        </div>

        {/* شبكة التواصل - موحدة الألوان */}
        <div className='w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8'>
          {displayPhone && (
            <motion.a
              href={toTelLink(displayPhone)}
              variants={fadeInUp}
              whileHover={{ y: -5 }}
              className='group flex flex-col items-center p-2 transition-all'
            >
              <div className='mb-6 p-5 rounded-full bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300 shadow-sm'>
                <Phone className='h-7 w-7' />
              </div>
              <p className='text-sm uppercase tracking-widest text-muted-foreground mb-2 font-medium'>
                اتصل بنا
              </p>
              <p className='font-bold text-2xl tracking-wider text-foreground' dir='ltr'>
                {formattedDisplayPhone}
              </p>
            </motion.a>
          )}

          {clinic.supportWhatsAppNumber && (
            <motion.a
              href={toWhatsAppLink(clinic.supportWhatsAppNumber)}
              target='_blank'
              rel='noopener noreferrer'
              variants={fadeInUp}
              whileHover={{ y: -5 }}
              className='group flex flex-col items-center p-2 transition-all'
            >
              <div className='mb-6 p-5 rounded-full bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300 shadow-sm'>
                <svg role='img' viewBox='0 0 24 24' className='w-7 h-7 fill-current'>
                  <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' />
                </svg>
              </div>
              <p className='text-sm uppercase tracking-widest text-muted-foreground mb-2 font-medium'>
                واتساب الدعم
              </p>
              <p className='font-bold text-2xl tracking-wider text-foreground' dir='ltr'>
                {formattedWhatsAppPhone}
              </p>
            </motion.a>
          )}

          {displayAddress && (
            <motion.a
              href={`https://maps.google.com/?q=${encodeURIComponent(displayAddress)}`}
              target='_blank'
              rel='noopener noreferrer'
              variants={fadeInUp}
              whileHover={{ y: -5 }}
              className='group flex flex-col items-center p-2 transition-all'
            >
              <div className='mb-6 p-5 rounded-full bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300 shadow-sm'>
                <MapPin className='h-7 w-7' />
              </div>
              <p className='text-sm uppercase tracking-widest text-muted-foreground mb-2 font-medium'>
                موقع العيادة
              </p>
              <p className='font-bold text-lg text-foreground leading-relaxed max-w-62.5'>
                {displayAddress}
              </p>
            </motion.a>
          )}
        </div>

        {/* السوشيال ميديا */}
        {socialItems.length > 0 && (
          <motion.div variants={fadeInUp} className='mt-24 w-full max-w-4xl'>
            <div className='flex items-center justify-center gap-4 mb-10'>
              <div className='h-px bg-border flex-1 max-w-25' />
              <p className='text-sm font-bold text-muted-foreground uppercase tracking-widest'>
                تابعنا على
              </p>
              <div className='h-px bg-border flex-1 max-w-25' />
            </div>

            <div className='flex flex-wrap items-center justify-center gap-6 md:gap-10'>
              {socialItems.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors'
                >
                  <div className='p-3 rounded-full bg-muted/50 group-hover:bg-primary/10 group-hover:text-primary transition-colors'>
                    <item.Icon className='h-5 w-5' />
                  </div>
                  <span className='font-medium text-sm hidden sm:inline-block'>{item.label}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}

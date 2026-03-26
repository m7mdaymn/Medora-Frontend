'use client'

import { fadeInUp, staggerContainer } from '@/animation'
import { Typography } from '@/components/ui/typography'
import { MapPin, MessageCircle, Phone } from 'lucide-react'
import { motion } from 'framer-motion'
import { IPublicClinic } from '../../types/public'

interface ExtendedClinic extends IPublicClinic {
  aboutDescription?: string
}

export default function AboutClinicSection({ clinic }: { clinic: ExtendedClinic }) {
  if (!clinic) return null

  const displayAddress = [clinic.city, clinic.address].filter(Boolean).join('، ')
  const displayPhone = clinic.phone || clinic.supportWhatsAppNumber
  const description =
    clinic.aboutDescription ||
    'نلتزم بتقديم رعاية طبية استثنائية تعتمد على أحدث التقنيات وأفضل الكفاءات. نضع صحتك وصحة أسرتك في قمة أولوياتنا لضمان تجربة علاجية آمنة ومريحة.'

  const activeCardsCount = [displayPhone, clinic.supportWhatsAppNumber, displayAddress].filter(
    Boolean,
  ).length

  const gridClass =
    activeCardsCount === 1
      ? 'grid-cols-1 max-w-sm mx-auto'
      : activeCardsCount === 2
        ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto'
        : 'grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto' // صغرنا العرض شوية عشان الكروت المينيمال بتبان أحلى وهي ملمومة

  return (
    <section id='about' className='py-24 md:py-32 relative overflow-hidden bg-background'>
      <motion.div
        className='container mx-auto px-4 md:px-6 flex flex-col items-center text-center space-y-16 relative z-10'
        variants={staggerContainer}
        initial='hidden'
        whileInView='visible'
        viewport={{ once: true, margin: '-100px' }}
      >
        {/* العناوين */}
        <div className='space-y-4 flex flex-col items-center w-full max-w-3xl'>
          <motion.div variants={fadeInUp}>
            <Typography
              variant='h2'
              className='text-3xl md:text-5xl font-bold tracking-tight text-foreground w-full'
            >
              لماذا تختار <span className='text-primary'>{clinic.clinicName}</span>
              <span className='text-muted-foreground'>؟</span>
            </Typography>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Typography variant='p' className='text-muted-foreground text-lg max-w-2xl mx-auto'>
              {description}
            </Typography>
          </motion.div>
        </div>

        {/* الكروت (Vercel / shadcn Style) */}
        <div className={`grid gap-6 w-full ${gridClass}`}>
          {/* كارت رقم الهاتف */}
          {displayPhone && (
            <motion.a
              href={`tel:${displayPhone}`}
              variants={fadeInUp}
              whileTap={{ scale: 0.98 }}
              className='group flex flex-col items-center justify-center gap-3 p-8 rounded-xl border bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors duration-200'
            >
              <Phone className='h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors' />
              <div className='space-y-1 text-center mt-2'>
                <p className='text-sm font-medium text-muted-foreground'>اتصل بنا</p>
                <p className='font-semibold text-lg text-foreground tracking-wide' dir='ltr'>
                  {displayPhone}
                </p>
              </div>
            </motion.a>
          )}

          {/* كارت الواتساب */}
          {clinic.supportWhatsAppNumber && (
            <motion.a
              href={`https://wa.me/${clinic.supportWhatsAppNumber.replace(/\D/g, '')}`}
              target='_blank'
              rel='noopener noreferrer'
              variants={fadeInUp}
              whileTap={{ scale: 0.98 }}
              className='group flex flex-col items-center justify-center gap-3 p-8 rounded-xl border bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors duration-200'
            >
              <MessageCircle className='h-6 w-6 text-muted-foreground  transition-colors' />
              <div className='space-y-1 text-center mt-2'>
                <p className='text-sm font-medium text-muted-foreground'>دعم واتساب</p>
                <p
                  className='font-semibold text-lg text-foreground tracking-wide  transition-colors'
                  dir='ltr'
                >
                  {clinic.supportWhatsAppNumber}
                </p>
              </div>
            </motion.a>
          )}

          {/* كارت العنوان */}
          {displayAddress && (
            <motion.a
              // صلحنا لينك جوجل مابس هنا عشان يفتح صح
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`}
              target='_blank'
              rel='noopener noreferrer'
              variants={fadeInUp}
              whileTap={{ scale: 0.98 }}
              className='group flex flex-col items-center justify-center gap-3 p-8 rounded-xl border bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors duration-200'
            >
              <MapPin className='h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors' />
              <div className='space-y-1 text-center mt-2'>
                <p className='text-sm font-medium text-muted-foreground'>موقعنا</p>
                <p className='font-semibold text-lg text-foreground line-clamp-2'>
                  {displayAddress}
                </p>
              </div>
            </motion.a>
          )}
        </div>
      </motion.div>
    </section>
  )
}

'use client'

import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { IPublicDoctor } from '@/types/public'
import { Award, Stethoscope } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/animation'
import { ClinicImage } from '../shared/clinic-image'

export default function AboutDoctorSection({ doctor }: { doctor: IPublicDoctor }) {
  if (!doctor) return null

  return (
    <section
      id='about-doctor'
      className='relative py-24 md:py-32 overflow-hidden bg-muted/30  w-full'
      dir='rtl'
    >
      <motion.div
        className='container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 md:gap-16 items-center relative z-10 max-w-6xl'
        variants={staggerContainer}
        initial='hidden'
        whileInView='visible'
        viewport={{ once: true, margin: '-100px' }}
      >
        {/* نصوص التعريف بالطبيب (بقت order-last في الشاشات الكبيرة عشان تيجي شمال) */}
        <motion.div
          variants={fadeInUp}
          className='flex flex-col space-y-8 text-center lg:text-right items-center lg:items-start order-1 lg:order-last'
        >
          <div className='space-y-4 flex flex-col items-center lg:items-start w-full'>
            <Badge
              variant='secondary'
              className='bg-muted text-muted-foreground px-4 py-1.5 text-sm font-medium w-fit'
            >
              عن الطبيب
            </Badge>
            <Typography
              variant='h2'
              className='text-3xl md:text-5xl font-bold tracking-tight text-foreground w-full'
            >
              {doctor.name}
            </Typography>
            <Typography
              variant='p'
              className='text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto lg:mx-0'
            >
              {doctor.bio || 'لم يتم إضافة نبذة تعريفية بعد.'}
            </Typography>
          </div>

          <div className='flex flex-col sm:flex-row gap-4 pt-4 w-full'>
            <div className='flex-1 flex flex-col lg:flex-row items-center lg:items-start gap-3 p-5 rounded-xl border bg-card text-card-foreground shadow-sm'>
              <Award className='h-6 w-6 text-muted-foreground shrink-0 mt-0.5' />
              <div className='text-center lg:text-start space-y-1 mt-1 lg:mt-0'>
                <p className='font-semibold text-foreground text-base'>خبرة معتمدة</p>
                <p className='text-sm font-medium text-muted-foreground leading-relaxed'>
                  تشخيص دقيق مبني على أحدث المعايير الطبية.
                </p>
              </div>
            </div>

            <div className='flex-1 flex flex-col lg:flex-row items-center lg:items-start gap-3 p-5 rounded-xl border bg-card text-card-foreground shadow-sm'>
              <Stethoscope className='h-6 w-6 text-muted-foreground shrink-0 mt-0.5' />
              <div className='text-center lg:text-start space-y-1 mt-1 lg:mt-0'>
                <p className='font-semibold text-foreground text-base'>رعاية متكاملة</p>
                <p className='text-sm font-medium text-muted-foreground leading-relaxed'>
                  متابعة مستمرة لحالتك الصحية خطوة بخطوة.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* صورة الطبيب (بقت order-first دايماً عشان تيجي يمين في الشاشات الكبيرة وفوق في الموبايل) */}
        <motion.div
          variants={fadeInUp}
          className='relative flex justify-center lg:justify-center mt-8 lg:mt-0 order-first lg:order-first'
        >
          <div className='relative w-full max-w-100 aspect-4/5 rounded-2xl overflow-hidden border border-border/50 bg-muted shadow-lg group'>
            <ClinicImage
              src={doctor.photoUrl}
              alt={doctor.name}
              fill
              fallbackType='doctor'
              className='object-cover transition-transform duration-700 group-hover:scale-[1.03]'
              priority
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

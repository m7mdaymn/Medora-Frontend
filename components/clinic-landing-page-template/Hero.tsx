'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toWhatsAppLink } from '../../lib/utils'
import { IPublicClinic } from '../../types/public'
import { ClinicImage } from '../shared/clinic-image'

interface HeroProps {
  clinic: IPublicClinic
  tenantSlug: string
}

export default function Hero({ clinic, tenantSlug }: HeroProps) {
  const heroImage =
    clinic.imgUrl ||
    'https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=1632&auto=format&fit=crop'

  return (
    <section className='relative w-full pt-24 pb-16 md:pt-32 md:pb-30 overflow-hidden'>
      <div className='w-full max-w-350 mx-auto px-6 md:px-12 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='flex flex-col items-start space-y-8 text-start order-1 lg:order-1'
        >
          <div className='space-y-6 w-full'>
            <h1 className='text-5xl md:text-6xl lg:text-[5rem] xl:text-[6rem] font-black leading-[1.1] tracking-tight'>
              رعاية متقدمة
              <br />
              <span className='italic text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60'>
                يمكنك{' '}
              </span>
              <span>الوثوق بها.</span>
            </h1>

            <p className='text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed font-normal'>
              {clinic.description ||
                'تشخيص رقمي دقيق، إجراءات طبية متطورة، ونتائج مضمونة في كل مرحلة من مراحل علاجك معنا.'}
            </p>
          </div>

          <Button size={'xl'} variant={'default'} asChild>
            <Link href={toWhatsAppLink(clinic.supportWhatsAppNumber)} target='_blank'>
              احجز الآن
              <ArrowLeft className='w-5 h-5 transition-transform duration-300 group-hover:-translate-x-2' />
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className='relative w-full max-w-2xl mx-auto lg:me-0 lg:max-w-none h-100 md:h-125 lg:h-160 group order-2 lg:order-2 shadow-[0_0_120px_40px_rgba(var(--primary)/0.08)] rounded-[2.5rem]'
        >
          {/* تأثير النقط 1: فوق يمين */}
          <div
            className='
  absolute -top-6 -right-6 h-32 w-32
  transition-transform duration-700 ease-out
  group-hover:-translate-x-2 group-hover:translate-y-2

  bg-[radial-gradient(rgba(14,165,233,0.50)_1.5px,transparent_1.5px)]
  bg-size-[16px_16px]
'
          />

          {/* تأثير النقط 2: تحت شمال */}
          <div
            className='
  absolute -bottom-6 -left-6 h-32 w-32
  transition-transform duration-700 ease-out
  group-hover:-translate-x-2 group-hover:translate-y-2

  bg-[radial-gradient(rgba(14,165,233,0.50)_1.5px,transparent_1.5px)]
  bg-size-[16px_16px]
'
          />

          {/* الصورة الأساسية */}
          <div className='relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-700 ease-out group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:shadow-2xl'>
            <ClinicImage
              src={heroImage}
              alt='رعاية طبية'
              fill
              fallbackType='general'
              className='object-cover object-center transition-transform duration-1000 group-hover:scale-110'
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

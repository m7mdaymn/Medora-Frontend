'use client'

import { fadeInUp, staggerContainer } from '@/animation'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

// السكشن الأول: شاشة الطبيب (موبايل/تابلت)
export function DashboardPreview() {
  return (
    <section className='py-24 overflow-hidden bg-background' dir='rtl'>
      <div className='container px-4 md:px-6 mx-auto max-w-6xl'>
        <motion.div
          className='flex flex-col lg:flex-row items-center gap-12 lg:gap-20'
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
        >
          {/* الجانب النصي */}
          <motion.div variants={fadeInUp} className='flex-1 space-y-6 text-right w-full max-w-2xl'>
            <div className='space-y-4'>
              <h2 className='text-3xl md:text-5xl font-bold tracking-tight leading-[1.15] text-foreground'>
                نظّم كشوفاتك <br className='hidden md:block' />
                <span className='text-muted-foreground'>بمنتهى البساطة</span>
              </h2>
              <p className='text-lg text-muted-foreground leading-relaxed font-medium'>
                واجهة ذكية بتعرض لك الحالة الحالية، وقائمة الانتظار، مع إمكانية نقل الدور بضغطة زر.
                ركز في تشخيصك وسيب تنظيم الحالات علينا.
              </p>
            </div>

            <div className='grid gap-4 pt-2'>
              {[
                'متابعة حية لترتيب الكشوفات بالخارج',
                'كتابة الروشتة وحفظها في ثوانٍ',
                'ربط فوري بين الدكتور وسكرتارية العيادة',
              ].map((point, i) => (
                <div key={i} className='flex items-center gap-3 font-semibold text-foreground/80'>
                  <CheckCircle2 className='w-5 h-5 text-primary shrink-0' />
                  <span className='text-base md:text-lg'>{point}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* الجانب البصري - Sizing Fixed */}
          <motion.div variants={fadeInUp} className='flex-1 relative flex justify-center w-full'>
            <div className='relative w-full max-w-70 md:max-w-[320px] aspect-9/19 rounded-[2.5rem] border-8 border-zinc-200 dark:border-zinc-800 bg-background shadow-2xl overflow-hidden'>
              <Image
                src='/landing/doctor.webp'
                alt='Medora Doctor Dashboard'
                fill
                className='object-cover'
                priority
              />
            </div>
            <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/10 blur-[100px] rounded-full -z-10' />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

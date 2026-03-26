'use client'

import { fadeInUp, staggerContainer } from '@/animation'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

export function LandingFinanceSection() {
  return (
    <section className='py-24 bg-muted/30 overflow-hidden' dir='rtl'>
      <div className='container px-4 md:px-6 mx-auto max-w-6xl'>
        <motion.div
          className='flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20'
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
        >
          {/* الجانب النصي */}
          <motion.div variants={fadeInUp} className='flex-1 space-y-6 text-right w-full max-w-2xl'>
            <div className='space-y-4'>
              <h2 className='text-3xl md:text-5xl font-bold tracking-tight leading-[1.15] text-foreground'>
                إدارة مالية <br className='hidden md:block' />
                <span className='text-muted-foreground'>بأعلى دقة</span>
              </h2>
              <p className='text-lg text-muted-foreground leading-relaxed font-medium'>
                وداعاً للحسابات اليدوية المعقدة. احصل على رؤية شاملة لأداء عيادتك المالي من خلال
                تقارير ذكية تحسب الإيرادات والمصروفات بصورة لحظية.
              </p>
            </div>

            <div className='grid gap-4 pt-2'>
              {[
                'تقارير أرباح يومية وشهرية مفصلة',
                'تتبع مستحقات الشركات والتعاقدات بدقة',
                'إدارة كاملة لمصروفات العيادة والنثريات',
              ].map((point, i) => (
                <div key={i} className='flex items-center gap-3 font-semibold text-foreground/80'>
                  <CheckCircle2 className='w-5 h-5 text-emerald-500 shrink-0' />
                  <span className='text-base md:text-lg'>{point}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* الجانب البصري - Sizing Fixed */}
          <motion.div variants={fadeInUp} className='flex-1 relative flex justify-center w-full'>
            {/* جعلنا الديسكتوب ملموم أكتر max-w-xl عشان ميبقاش ضخم مقارنة بالموبايل */}
            <div className='relative w-full max-w-xl aspect-16/10 rounded-2xl p-2 bg-zinc-200 dark:bg-zinc-800 border border-border/50 shadow-2xl overflow-hidden'>
              <div className='relative w-full h-full rounded-xl overflow-hidden border border-border/50 bg-background'>
                <Image
                  src='/landing/dashboard.webp'
                  alt='Medora Finance Dashboard'
                  fill
                  className='object-cover object-top'
                  priority
                />
              </div>
            </div>
            <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-emerald-500/10 blur-[100px] rounded-full -z-10' />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

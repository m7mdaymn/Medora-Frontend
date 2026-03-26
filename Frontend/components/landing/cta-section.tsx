'use client'

import { fadeInUp, staggerContainer } from '@/animation'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { CheckCircle2, MessageCircle } from 'lucide-react' // استبدلنا PhoneCall بـ MessageCircle
import Link from 'next/link'

export function CTASection() {
  return (
    <section
      className='relative py-24 md:py-32 overflow-hidden bg-muted/50 border-t border-border/40'
      dir='rtl'
    >
      <div className='container mx-auto relative z-10 px-4 md:px-6'>
        <motion.div
          className='flex flex-col items-center text-center max-w-4xl mx-auto'
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {/* عنوان قوي ومباشر */}
          <motion.h2
            variants={fadeInUp}
            className='text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.15]'
          >
            جاهز تنقل إدارة عيادتك <br />
            <span className='text-muted-foreground'>لمستوى تاني من الاحترافية؟</span>
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className='text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed font-medium'
          >
            انضم للأطباء اللي اختاروا <span className='text-foreground font-bold'>ميدورا</span> عشان
            يريحوا دماغهم من هم الإدارة ويركزوا بس في مرضاهم.
          </motion.p>

          {/* زرار الواتساب */}
          <motion.div
            variants={fadeInUp}
            className='flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto'
          >
            <Button
              size='lg'
              asChild
            >
              {/* تعديل اللينك للواتساب مباشرة */}
              <Link href='https://wa.me/201070272135' target='_blank' rel='noopener noreferrer'>
                <MessageCircle className='ml-2 h-5 w-5' />
                تواصل معنا عبر واتساب
              </Link>
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={fadeInUp}
            className='flex flex-wrap items-center justify-center gap-6 md:gap-10 mt-16 text-sm md:text-base font-semibold text-muted-foreground'
          >
            {['إعداد السيستم في أقل من 24 ساعة', 'دعم فني معاك خطوة بخطوة'].map((text, i) => (
              <div key={i} className='flex items-center gap-2'>
                <CheckCircle2 className='h-5 w-5 text-primary/70' />
                {text}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

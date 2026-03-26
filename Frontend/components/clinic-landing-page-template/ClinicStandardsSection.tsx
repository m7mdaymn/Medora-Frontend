'use client'

import { Clock, HeartHandshake, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/animation'
import { Typography } from '@/components/ui/typography'

// داتا حقيقية ومقنعة لأي عيادة بدون مبالغات
const standards = [
  {
    id: 1,
    title: 'معايير أمان صارمة',
    description: 'نطبق بروتوكولات تعقيم عالمية لضمان بيئة طبية آمنة تماماً لك ولأسرتك.',
    icon: Shield,
  },
  {
    id: 2,
    title: 'رعاية إنسانية',
    description: 'نستمع لمخاوفك بعناية ونضع راحتك النفسية والجسدية على رأس أولوياتنا.',
    icon: HeartHandshake,
  },
  {
    id: 3,
    title: 'احترام وقتك',
    description: 'نظام إدارة حجوزات دقيق يضمن لك الدخول في موعدك دون فترات انتظار مزعجة.',
    icon: Clock,
  },
]

export default function ClinicStandardsSection() {
  return (
    // ادينا السكشن ده خلفية مختلفة سنة صغيرة عشان يفصل عن اللي قبله بس يفضل سيمبل
    <section className='py-24 md:py-32 relative overflow-hidden '>
      <motion.div
        className='container mx-auto px-4 md:px-6 flex flex-col items-center text-center space-y-16 relative z-10'
        variants={staggerContainer}
        initial='hidden'
        whileInView='visible'
        viewport={{ once: true, margin: '-100px' }}
      >
        {/* العناوين (نفس الستايل المينيمال) */}
        <div className='space-y-4 flex flex-col items-center w-full max-w-3xl'>
          <motion.div variants={fadeInUp}>
            <Typography
              variant='h2'
              className='text-3xl md:text-5xl font-bold tracking-tight text-foreground w-full'
            >
              لماذا يثق بنا <span className='text-primary'>المرضى</span>
              <span className='text-muted-foreground'>؟</span>
            </Typography>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Typography variant='p' className='text-muted-foreground text-lg max-w-2xl mx-auto'>
              لا نقدم مجرد علاج، بل نصنع تجربة رعاية طبية متكاملة تضعك في المركز الأول وتضمن لك راحة
              البال.
            </Typography>
          </motion.div>
        </div>

        {/* الكروت (نفس ستايل Vercel / shadcn بالحرف) */}
        <div className='grid gap-6 w-full grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto'>
          {standards.map((item) => (
            <motion.div
              key={item.id}
              variants={fadeInUp}
              whileTap={{ scale: 0.98 }}
              // نفس الكلاسات بالضبط: rounded-xl, border, bg-card, hover:bg-muted/50
              className=' flex flex-col items-center justify-center gap-3 p-8 rounded-xl border bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors duration-200'
            >
              <item.icon className='h-6 w-6 text-muted-foreground' />
              <div className='space-y-2 text-center mt-2'>
                <h3 className='font-semibold text-lg text-foreground tracking-wide'>
                  {item.title}
                </h3>
                <p className='text-sm font-medium text-muted-foreground leading-relaxed'>
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

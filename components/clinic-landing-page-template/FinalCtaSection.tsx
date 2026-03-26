'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'

interface FinalCtaSectionProps {
  tenantSlug: string
}

export default function FinalCtaSection({ tenantSlug }: FinalCtaSectionProps) {
  return (
    <section className='py-20 bg-background' dir='rtl'>
      <div className='container mx-auto px-4 md:px-8 max-w-5xl'>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className='bg-primary rounded-[2.5rem] p-10 md:p-16 text-center text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden'
        >
          <div className='absolute top-0 right-0 w-64 h-64 bg-background opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none' />
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-foreground opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none' />

          <div className='relative z-10 flex flex-col items-center space-y-6'>
            <h2 className='text-3xl md:text-5xl font-medium tracking-tight'>
              صحتك تستحق <span className='font-bold'>الأفضل.</span>
            </h2>
            <p className='text-primary-foreground/90 text-lg md:text-xl max-w-2xl mx-auto'>
              لا تؤجل العناية بصحتك. احجز استشارتك الآن وانضم لآلاف المرضى الذين يثقون برعايتنا.
            </p>
            <div className='pt-4'>
              <Button
                size='lg'
                className='rounded-full h-14 px-10 text-lg font-bold bg-background text-foreground hover:bg-muted transition-colors gap-2'
                asChild
              >
                <Link href={`/${tenantSlug}#booking`}>
                  احجز موعدك الآن <ArrowLeft className='w-5 h-5' />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

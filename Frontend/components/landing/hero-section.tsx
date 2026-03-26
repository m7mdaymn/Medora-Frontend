'use client'

import { fadeInUp, staggerContainer } from '@/animation'
import { Button } from '@/components/ui/button'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowLeft, BarChart3, Calendar, ChevronDown, ShieldCheck, User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { StarfieldBackground } from '../ui/starfield'

export default function HeroSection() {
  const [isMobile, setIsMobile] = useState(false)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const springConfig = { damping: 50, stiffness: 250 }
  const smoothX = useSpring(mouseX, springConfig)
  const smoothY = useSpring(mouseY, springConfig)

  const floatX1 = useTransform(smoothX, [-0.5, 0.5], [-35, 35])
  const floatY1 = useTransform(smoothY, [-0.5, 0.5], [-35, 35])
  const floatX2 = useTransform(smoothX, [-0.5, 0.5], [45, -45])
  const floatY2 = useTransform(smoothY, [-0.5, 0.5], [45, -45])
  const floatX3 = useTransform(smoothX, [-0.5, 0.5], [25, -25])
  const floatY3 = useTransform(smoothY, [-0.5, 0.5], [-45, 45])
  const floatX4 = useTransform(smoothX, [-0.5, 0.5], [-45, 45])
  const floatY4 = useTransform(smoothY, [-0.5, 0.5], [25, -25])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return
    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window
    mouseX.set(clientX / innerWidth - 0.5)
    mouseY.set(clientY / innerHeight - 0.5)
  }

  return (
    <section
      className='relative min-h-[95vh] flex items-center justify-center overflow-hidden w-full pt-20 pb-16 bg-background'
      dir='rtl'
      onMouseMove={handleMouseMove}
    >
      <StarfieldBackground className='absolute inset-0 z-0 hidden md:block' />

      {/* Background Blobs */}
      <div className='absolute top-[-10%] right-[-10%] w-75 h-75 md:w-125 md:h-125 bg-primary/20 rounded-full blur-[80px] md:blur-[120px] pointer-events-none z-0 transform-gpu opacity-50 md:opacity-100' />
      <div className='absolute bottom-[-10%] left-[-10%] w-75 h-75 md:w-100 md:h-100 bg-emerald-500/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none z-0 transform-gpu opacity-50 md:opacity-100' />

      {/* Noise */}
      <div className='absolute inset-0 bg-[url("https://grainy-gradients.vercel.app/noise.svg")] opacity-[0.03] md:opacity-5 md:mix-blend-overlay pointer-events-none z-0'></div>

      {/* 🔴 التعديل السحري: الـ Fade اللي بيخلي الهيرو يسيح مع السكشن اللي تحته */}
      <div className='absolute bottom-0 left-0 w-full h-32 md:h-64 bg-linear-to-t from-background via-background/80 to-transparent pointer-events-none z-10' />

      <div className='container mx-auto px-4 relative z-20'>
        <motion.div
          className='flex flex-col items-center justify-center text-center max-w-5xl mx-auto space-y-10'
          variants={staggerContainer}
          initial='hidden'
          animate='visible'
        >
          <div className='space-y-4 md:space-y-2'>
            <motion.div variants={fadeInUp} className='w-full'>
              <h1 className='text-6xl md:text-8xl lg:text-[7rem] font-sans font-black text-foreground tracking-tight leading-[1.1]'>
                MEDORA CLINIC
              </h1>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <p className='text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium px-2'>
                إنسى الورق ولخبطة الحسابات. سيستم واحد بيدير عيادتك من أول حجز الميعاد لحد التقارير
                المالية، عشان تتفرغ إنت لمرضاك
              </p>
            </motion.div>
          </div>

          <motion.div
            variants={fadeInUp}
            className='flex flex-row items-center justify-center gap-4 sm:gap-5 pt-4 w-full'
          >
            <Link href='https://wa.me/201070272135' target='_blank' rel='noopener noreferrer'>
              <Button
                size='lg'
                className='h-12 px-5 sm:px-8 w-auto font-bold text-sm sm:text-base rounded-full shadow-lg hover:-translate-y-1 transition-transform'
              >
                احجز نسختك
                <ArrowLeft className='mr-2 h-5 w-5' />
              </Button>
            </Link>
            <Link
              href='https://www.facebook.com/share/1BNbjo8Byz/'
              target='_blank'
              rel='noopener noreferrer'
            >
              <Button
                size='lg'
                variant='outline'
                className='h-12 px-5 sm:px-8 w-auto font-bold text-sm sm:text-base rounded-full bg-background/50 backdrop-blur-sm border-border hover:bg-muted transition-colors'
              >
                مشاهدة السيستم
              </Button>
            </Link>
          </motion.div>

          <motion.div variants={fadeInUp} className='flex flex-col items-center gap-3 pt-8'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground font-semibold tracking-wider uppercase'>
              <span>موثوق من الأطباء</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating SaaS Cards */}
        {!isMobile && (
          <>
            <motion.div
              className='absolute top-[15%] right-[2%] lg:right-[5%] bg-card/40 border border-primary/20 p-4 rounded-2xl shadow-xl flex items-center gap-4 backdrop-blur-xl'
              style={{ x: floatX1, y: floatY1 }}
            >
              <div className='bg-primary/10 p-2 rounded-lg'>
                <Calendar className='w-6 h-6 text-primary' />
              </div>
              <div className='text-right hidden xl:block'>
                <p className='font-bold text-sm text-foreground'>إدارة المواعيد</p>
              </div>
            </motion.div>

            <motion.div
              className='absolute bottom-[20%] left-[2%] lg:left-[5%] bg-card/40 border border-emerald-500/20 p-4 rounded-2xl shadow-xl flex items-center gap-4 backdrop-blur-xl'
              style={{ x: floatX2, y: floatY2 }}
            >
              <div className='bg-emerald-500/10 p-2 rounded-lg'>
                <BarChart3 className='w-6 h-6 text-emerald-500' />
              </div>
              <div className='text-right hidden xl:block'>
                <p className='font-bold text-sm text-foreground'>تقارير مالية</p>
              </div>
            </motion.div>

            <motion.div
              className='absolute top-[25%] left-[5%] lg:left-[8%] bg-card/40 border border-blue-500/20 p-4 rounded-2xl shadow-xl flex items-center gap-4 backdrop-blur-xl'
              style={{ x: floatX3, y: floatY3 }}
            >
              <div className='bg-blue-500/10 p-2 rounded-lg'>
                <User className='w-6 h-6 text-blue-500' />
              </div>
              <div className='text-right hidden xl:block'>
                <p className='font-bold text-sm text-foreground'>سجلات طبية</p>
              </div>
            </motion.div>

            <motion.div
              className='absolute bottom-[30%] right-[8%] lg:right-[10%] bg-card/40 border border-amber-500/20 p-4 rounded-2xl shadow-xl flex items-center gap-4 backdrop-blur-xl'
              style={{ x: floatX4, y: floatY4 }}
            >
              <div className='bg-amber-500/10 p-2 rounded-lg'>
                <ShieldCheck className='w-6 h-6 text-amber-500' />
              </div>
              <div className='text-right hidden xl:block'>
                <p className='font-bold text-sm text-foreground'>أمان عالي</p>
              </div>
            </motion.div>
          </>
        )}
      </div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className='absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-30 z-20 md:flex'
      >
        <ChevronDown className='w-6 h-6' />
      </motion.div>
    </section>
  )
}

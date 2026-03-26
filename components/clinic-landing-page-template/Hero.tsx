'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { IPublicClinic } from '../../types/public'

interface HeroProps {
  clinic: IPublicClinic
  tenantSlug: string
}

export default function Hero({ clinic, tenantSlug }: HeroProps) {
  return (
    <section className='relative w-full pt-24 pb-16 md:pt-32 md:pb-30 overflow-hidden' >
      <div className='w-full max-w-350 mx-auto px-6 md:px-12 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center'>
        {/* النصف الأيمن: النصوص (واخد order-1 في الموبايل و order-1 في الكبير) */}
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
              تشخيص رقمي دقيق، إجراءات طبية متطورة، ونتائج مضمونة في كل مرحلة من مراحل علاجك معنا.
            </p>
          </div>

          <Button
            className='rounded-full h-14 px-8 text-base font-bold transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(var(--primary))] hover:-translate-y-1 gap-2 group'
            asChild
          >
            <Link href={`/${tenantSlug}#booking`}>
              احجز استشارتك
              <ArrowLeft className='w-5 h-5 transition-transform duration-300 group-hover:-translate-x-2' />
            </Link>
          </Button>
        </motion.div>

        {/* النصف الأيسر: الصورة وتأثير النقط (واخد order-2 في الموبايل و order-2 في الكبير عشان يبقى الكلام فوق والصورة تحت) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          // 🔴 عدلنا الـ h عشان تناسب إن الكروت اتمسحت وتبقى ريسبونسف
          className='relative w-full max-w-2xl mx-auto lg:me-0 lg:max-w-none h-100 md:h-125 lg:h-160 group order-2 lg:order-2'
        >
          {/* الإطار المودرن 1: لون أساسي متدرج */}
          <div className='absolute inset-0 rounded-[2.5rem] bg-linear-to-tl from-primary to-primary/40 opacity-80 transition-all duration-700 ease-out group-hover:-translate-x-6 group-hover:translate-y-4 group-hover:-rotate-2 -z-10 shadow-2xl' />

          {/* الإطار المودرن 2: خط خفيف بيتحرك العكس */}
          <div className='absolute inset-0 rounded-[2.5rem] border border-border/50 bg-muted/20 transition-all duration-700 ease-out group-hover:translate-x-3 group-hover:-translate-y-3 -z-20' />

          {/* 🔴 تأثير النقط (Dot Grid Pattern) 1: فوق يمين */}
          <div
            className='absolute -top-6 -right-6 h-24 w-24 opacity-20 transition-transform duration-700 ease-out group-hover:translate-x-4 group-hover:-translate-y-4'
            style={{
              backgroundImage: 'radial-gradient(hsl(var(--primary)) 1.5px, transparent 1.5px)',
              backgroundSize: '12px 12px',
            }}
          />

          {/* 🔴 تأثير النقط (Dot Grid Pattern) 2: تحت شمال */}
          <div
            className='absolute -bottom-6 -left-6 h-24 w-24 opacity-20 transition-transform duration-700 ease-out group-hover:-translate-x-4 group-hover:translate-y-4'
            style={{
              backgroundImage: 'radial-gradient(hsl(var(--primary)) 1.5px, transparent 1.5px)',
              backgroundSize: '12px 12px',
            }}
          />

          {/* الصورة الأساسية (بدون كروت المميزات وبدون الضل اللي كان تحت الكروت) */}
          <div className='relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-700 ease-out group-hover:translate-x-2 group-hover:-translate-y-2 group-hover:shadow-2xl'>
            <Image
              src='https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=1632&auto=format&fit=crop'
              alt='رعاية طبية'
              fill
              className='object-cover object-center transition-transform duration-1000 group-hover:scale-110'
              priority
            />
            {/* ضل خفيف جداً شامل عشان يدي فخامة بس مش عشان كروت */}
            <div className='absolute inset-0 bg-linear-to-t from-background/30 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100' />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

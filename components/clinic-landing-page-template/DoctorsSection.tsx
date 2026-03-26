'use client'

import { fadeInUp, staggerContainer } from '@/animation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Typography } from '@/components/ui/typography'
import { motion } from 'framer-motion'
import { IPublicDoctor } from '../../types/public'
import { ClinicImage } from '../shared/clinic-image' // 👈 استيراد المكون الموحد

export default function DoctorsSection({ doctors }: { doctors: IPublicDoctor[] }) {
  if (!doctors || doctors.length <= 1) return null

  return (
    <section
      id='doctors'
      className='py-24 md:py-32 relative overflow-hidden bg-muted/30'
      dir='rtl'
    >
      {/* إضاءة خلفية ناعمة */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-primary/5 rounded-full blur-[120px] pointer-events-none' />

      <motion.div
        className='container mx-auto px-4 md:px-6'
        variants={staggerContainer}
        initial='hidden'
        whileInView='visible'
        viewport={{ once: true, margin: '-100px' }}
      >
        {/* --- Header --- */}
        <div className='flex flex-col items-center justify-center text-center space-y-4 mb-12 md:mb-16'>
          <motion.div variants={fadeInUp}>
            <Typography
              variant='h2'
              className='text-3xl md:text-5xl font-black tracking-tight text-foreground'
            >
              أطباء{' '}
              <span className='text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60'>
                العيادة
              </span>
            </Typography>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Typography variant='lead' className='max-w-2xl text-muted-foreground'>
              فريق طبي متميز بتخصصات دقيقة لضمان أفضل تشخيص وعلاج. نجمع بين الخبرة العالية والرعاية
              الإنسانية.
            </Typography>
          </motion.div>
        </div>

        {/* --- Carousel --- */}
        <motion.div variants={fadeInUp} className='max-w-7xl mx-auto w-full relative'>
          <Carousel
            opts={{
              align: 'start',
              direction: 'rtl',
              loop: false,
            }}
            className='w-full'
          >
            <CarouselContent className='-ml-2 md:-ml-4'>
              {doctors.map((doctor) => (
                <CarouselItem
                  key={doctor.id}
                  className='pl-2 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3'
                >
                  <Card className='group p-0 flex flex-col h-full rounded-4xl border border-border/50 bg-card/60 backdrop-blur-sm hover:bg-card shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden cursor-grab active:cursor-grabbing'>
                    {/* Image Container */}
                    <div className='relative w-full aspect-square md:aspect-4/3 overflow-hidden bg-muted/50'>
                      {/* 👈 استخدام المكون الموحد: بيتعامل مع المسار الـ relative والـ absolute لوحده */}
                      <ClinicImage
                        src={doctor.photoUrl}
                        alt={doctor.name}
                        fill
                        fallbackType='doctor'
                        className='object-cover select-none object-top transition-transform duration-700 group-hover:scale-110'
                      />

                      {/* Gradient Overlay */}
                      <div className='absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500' />

                      {/* Floating Specialty Badge */}
                      <div className='absolute bottom-4 right-4 z-10'>
                        <Badge className='bg-primary text-primary-foreground shadow-lg backdrop-blur-md px-3 py-1 font-bold text-sm border-none'>
                          {doctor.specialty || 'طبيب متخصص'}
                        </Badge>
                      </div>
                    </div>

                    {/* Card Body */}
                    <CardContent className='flex flex-col flex-1 p-6 text-right'>
                      <Typography
                        variant='h4'
                        className='font-black text-xl mb-3 text-foreground group-hover:text-primary transition-colors'
                      >
                        {doctor.name}
                      </Typography>

                      <Typography
                        variant='muted'
                        className='line-clamp-3 leading-relaxed text-sm mb-4 flex-1'
                      >
                        {doctor.bio || 'لا توجد نبذة مختصرة.'}
                      </Typography>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>

            <div className='hidden md:flex items-center justify-center gap-4 mt-10'>
              <CarouselNext className='static translate-y-0 translate-x-0 h-12 w-12 border-border/50 bg-card hover:bg-primary hover:text-primary-foreground transition-colors' />
              <CarouselPrevious className='static translate-y-0 translate-x-0 h-12 w-12 border-border/50 bg-card hover:bg-primary hover:text-primary-foreground transition-colors' />
            </div>
          </Carousel>
        </motion.div>
      </motion.div>
    </section>
  )
}

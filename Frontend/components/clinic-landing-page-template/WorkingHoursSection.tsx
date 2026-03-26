'use client'

import { fadeInUp, staggerContainer } from '@/animation'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { DAY_ORDER, DAYS_AR, IPublicWorkingHour } from '@/types/public'
import { formatTime } from '../../lib/formatTime'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function WorkingHoursSection({
  workingHours,
}: {
  workingHours: IPublicWorkingHour[]
}) {
  if (!workingHours?.length) return null

  const sortedHours = [...workingHours].sort(
    (a, b) => (DAY_ORDER[a.dayOfWeek] ?? 99) - (DAY_ORDER[b.dayOfWeek] ?? 99),
  )

  return (
    <section className='py-24 md:py-32 relative overflow-hidden bg-background' dir='rtl'>
      <motion.div
        className='container px-4 md:px-6 max-w-2xl mx-auto relative z-10'
        variants={staggerContainer}
        initial='hidden'
        whileInView='visible'
        viewport={{ once: true, margin: '-100px' }}
      >
        {/* العناوين */}
        <div className='flex flex-col items-center text-center space-y-4 mb-14'>
          <motion.div variants={fadeInUp}>
            <Typography
              variant='h2'
              className='text-3xl md:text-5xl font-bold tracking-tight text-foreground w-full'
            >
              مواعيد <span className='text-primary'>العيادة</span>
            </Typography>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <Typography variant='p' className='text-muted-foreground text-lg'>
              نحن هنا لخدمتك في الأوقات التالية
            </Typography>
          </motion.div>
        </div>

        {/* قائمة المواعيد (بدون ستايل الجدول) */}
        <div className='flex flex-col gap-3'>
          {sortedHours.map((wh, index) => {
            const isActive = wh.isActive
            const dayName = DAYS_AR[wh.dayOfWeek] ?? wh.dayOfWeek

            return (
              <motion.div
                key={wh.dayOfWeek}
                variants={fadeInUp}
                custom={index} // عشان نعمل تأخير متدرج في الأنيميشن لو حابب
                className={cn(
                  // 🔴 كبسولة منفصلة بدون بوردر، بتعتمد على لون خلفية خفيف جداً
                  'group flex flex-row items-center justify-between gap-4 px-6 py-4 rounded-2xl transition-colors hover:bg-muted/50',
                  isActive ? 'bg-muted/20' : 'bg-transparent opacity-70',
                )}
              >
                <div className='flex items-center gap-4'>
                  <span
                    className={cn(
                      'text-base md:text-lg font-semibold tracking-wide',
                      isActive ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {dayName}
                  </span>

                  {!isActive && (
                    <Badge
                      variant='secondary'
                      className='text-xs font-medium bg-muted text-muted-foreground'
                    >
                      مغلق
                    </Badge>
                  )}
                </div>

                {isActive ? (
                  <div className='flex items-center gap-2 font-medium text-foreground text-sm md:text-base'>
                    <span>{formatTime(wh.startTime)}</span>
                    <span className='text-muted-foreground/50 mx-1'>-</span>
                    <span>{formatTime(wh.endTime)}</span>
                  </div>
                ) : (
                  <div className='text-sm font-medium text-muted-foreground'>عطلة أسبوعية</div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* الملاحظة السفلية */}
        <motion.div variants={fadeInUp}>
          <p className='text-center text-sm font-medium text-muted-foreground mt-8'>
            المواعيد قابلة للتعديل في الأعياد والمناسبات الرسمية. يُفضَّل الحجز المسبق.
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}

'use client'

import { fadeInUp, staggerContainer } from '@/animation'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { motion } from 'framer-motion'
import Link from 'next/link'

const faqs = [
  {
    question: 'هل النظام مناسب لعيادتي الفردية؟',
    answer:
      'بالتأكيد. ميدورا مصمم ليكون مرناً، سواء كنت تدير عيادة خاصة بمفردك أو مركزاً طبياً كبيراً يضم تخصصات متعددة. النظام يتكيف مع حجم عملك بسهولة.',
  },
  {
    question: 'ما مدى أمان بيانات المرضى والتقارير؟',
    answer:
      'أمان البيانات هو أساس نظامنا. نستخدم بنية برمجية معزولة (Multi-tenant) تضمن خصوصية بيانات كل عيادة بشكل كامل، مع تشفير كافة الملفات والروشتات وفق أعلى المعايير.',
  },
  {
    question: 'هل أحتاج لأجهزة كمبيوتر بمواصفات خاصة؟',
    answer:
      'لا، النظام يعمل بالكامل سحابياً (Cloud-based). كل ما تحتاجه هو متصفح إنترنت على أي جهاز (كمبيوتر، تابلت، أو موبايل) لتبدأ العمل فوراً من أي مكان.',
  },
  {
    question: 'هل يدعم النظام الحجز الإلكتروني؟',
    answer:
      'نعم، نوفر لك صفحة حجز خاصة بعيادتك تمكن المرضى من رؤية المواعيد المتاحة وحجزها إلكترونياً، مما يقلل ضغط الاتصالات على موظفي الاستقبال.',
  },
  {
    question: 'كيف يعمل نظام التنبيهات عبر واتساب؟',
    answer:
      'يقوم النظام آلياً بإرسال رسائل لتأكيد الحجز وتذكير المريض بموعده قبل الزيارة، مما يقلل بشكل كبير من نسب التخلف عن المواعيد.',
  },
  {
    question: 'ما هو شكل الدعم الفني المتاح؟',
    answer:
      'فريقنا متاح تقريباً على مدار الساعة عبر الواتساب والهاتف للرد على أي استفسار أو حل أي مشكلة فنية قد تواجهك لضمان استقرار عمل عيادتك.',
  },
]

export default function FAQSection() {
  return (
    <section id='faq' className='py-24 md:py-32 bg-background' dir='rtl'>
      <div className='container mx-auto px-4 md:px-6 max-w-4xl'>
        {/* Header */}
        <motion.div
          className='text-center mb-20 space-y-4'
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.h2
            variants={fadeInUp}
            className='text-3xl md:text-5xl font-bold tracking-tight text-foreground'
          >
            أسئلة <span className='text-muted-foreground'>شائعة</span>
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className='text-lg text-muted-foreground max-w-xl mx-auto font-medium'
          >
            إجابات سريعة لأكثر التساؤلات التي قد تدور في ذهنك حول النظام.
          </motion.p>
        </motion.div>

        {/* 🔴 Accordion: ستايل القائمة النظيفة (Simple & Modern) */}
        <motion.div
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <Accordion type='single' collapsible className='w-full border-t border-border/60'>
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className='border-b border-border/60 transition-colors hover:bg-muted/30 px-2'
              >
                <AccordionTrigger className='text-right py-6 hover:no-underline font-bold text-lg md:text-xl text-foreground/90'>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className='text-base md:text-lg text-muted-foreground leading-relaxed pb-6 font-medium'>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Footer Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className='text-center mt-12 text-muted-foreground font-medium'
        >
          عندك سؤال تاني؟{' '}
          <Link href='https://wa.me/201070272135' target='_blank' rel='noopener noreferrer' className='underline text-blue-500'>
            تواصل معنا مباشرة
          </Link>
        </motion.p>
      </div>
    </section>
  )
}

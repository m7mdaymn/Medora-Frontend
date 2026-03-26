import { CheckCircle2 } from "lucide-react";

export function PrescriptionSection() {
  return (
    <section className='py-20 bg-muted/5' dir='rtl'>
      <div className='container px-6 mx-auto flex flex-col lg:flex-row items-center gap-16'>
        <div className='flex-1 space-y-6 border '>
          <h2 className='text-3xl md:text-5xl font-black tracking-tighter'>
            روشتة <span className='text-primary'>تليق باسمك</span>
          </h2>
          <p className='text-lg text-muted-foreground'>
            وداعاً للخط غير المفهوم. أصدر روشتة مطبوعة أو رقمية ببيانات المريض وتاريخه الطبي في
            ثوانٍ.
          </p>
          <ul className='grid gap-3'>
            {[
              'دعم كامل لأسماء الأدوية',
              'لوجو العيادة وبيانات التواصل',
              'أرشفة فورية لكل روشتة',
            ].map((item, i) => (
              <li key={i} className='flex items-center gap-2 font-medium text-foreground/80'>
                <CheckCircle2 className='w-4 h-4 text-primary' /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className='flex-1 flex justify-center '>
          <div className='w-64 h-112.5 bg-white shadow-2xl rounded-sm border-t-20 border-primary p-6 relative'>
            <div className='w-12 h-12 bg-primary/10 rounded-full mb-4' />
            <div className='space-y-2'>
              <div className='h-2 w-3/4 bg-muted rounded' />
              <div className='h-2 w-1/2 bg-muted rounded' />
            </div>
            <div className='mt-10 space-y-4'>
              <div className='h-4 w-full bg-muted/30 rounded' />
              <div className='h-4 w-full bg-muted/30 rounded' />
              <div className='h-4 w-3/4 bg-muted/30 rounded' />
            </div>
            <p className='absolute bottom-6 right-6 text-[10px] font-bold opacity-20'>
              MEDORA SYSTEM
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

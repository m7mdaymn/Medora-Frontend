// app/[tenantSlug]/manifest.json/route.ts
import { getFullImageUrl } from '@/lib/utils'
import { BaseApiResponse } from '@/types/api'
import { IPublicClinic } from '@/types/public'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> },
) {
  const { tenantSlug } = await params

  // 1. هنجيب داتا العيادة زي ما عملنا في الـ Layout قبل كده
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/public/${tenantSlug}/clinic`,
    { next: { revalidate: 3600 } },
  )

  if (!response.ok) {
    return new Response('Clinic Not Found', { status: 404 })
  }

  const result = (await response.json()) as BaseApiResponse<IPublicClinic>
  const clinic = result.data

  if (!clinic) {
    return new Response('Clinic Not Found', { status: 404 })
  }

  // 2. تطبيق الفانكشن بتاعتك عشان نضمن إن الرابط سليم 100%
  const logoUrl = getFullImageUrl(clinic.logoUrl) || '/icon-512x512.png' // لو مفيش لوجو نرجع للأساسي بتاع ميدورا

  // 3. بناء الـ Manifest الخاص بالعيادة
  const manifest = {
    name: clinic.clinicName || 'عيادة طبية',
    short_name: clinic.clinicName || 'عيادة',
    description: `نظام إدارة عيادة ${clinic.clinicName}` || 'نظام إدارة عيادات',

    // 🔴 التعديل السحري هنا لفصل التطبيقات
    id: `/${tenantSlug}-medora-pwa`, // بندي ID مستحيل يتشابه مع عيادة تانية
    start_url: `/${tenantSlug}/?source=pwa`, // بنضيف Query عشان الرابط يبقى مميز وميكييش
    scope: `/${tenantSlug}/`, // 🔴 السلاش الأخيرة دي حياة أو موت، دي اللي بتقفل التطبيق على مسار العيادة بس
    // ---------------------------------

    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    icons: [
      {
        src: logoUrl,
        sizes: 'any', // 🔴 السر هنا: بنقول للمتصفح اقبل الصورة بأي مقاس العيادة رافعاه
        type: 'image/png',
        purpose: 'any maskable', // 🔴 عشان الأندرويد يقصها جوه دايرة أو مربع شيك ومتبقاش مقطوشة
      },
      {
        src: '/icon-512x512.png', // Fallback لبراند Medora عشان الـ Lighthouse ميزعلش
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }

  // 4. إرجاع النتيجة كـ JSON عشان المتصفح يفهمها
  return Response.json(manifest)
}

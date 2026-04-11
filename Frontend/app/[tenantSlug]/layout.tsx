import { IPublicClinic } from '@/types/public'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { TenantInitializer } from '../../components/TenantInitializer'
import { getFullImageUrl } from '../../lib/utils'
import { BaseApiResponse } from '../../types/api'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}

// 1. دالة معزولة لجلب البيانات عشان نستخدمها في الـ SEO والـ Layout بدون تكرار كود
async function getClinicData(tenantSlug: string): Promise<IPublicClinic | null> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/public/${tenantSlug}/clinic`,
    { next: { revalidate: 3600 } },
  )

  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error('Failed to fetch clinic data') // الـ Error Boundary هيمسكه لو موجود
  }

  const result = (await response.json()) as BaseApiResponse<IPublicClinic>
  return result.data
}

// 2. بناء الـ SEO الديناميكي لكل عيادة (Tenant)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantSlug: string }>
}): Promise<Metadata> {
  const { tenantSlug } = await params
  const clinic = await getClinicData(tenantSlug)

  if (!clinic) {
    return {
      title: 'عيادة غير موجودة',
    }
  }

  // استخدام دالتك الجاهزة
  const absoluteShareImageUrl = getFullImageUrl(clinic.imgUrl || clinic.logoUrl)

  return {
    title: clinic.clinicName,
    // 👇 السطر اللي أنت نسيته: إجبار الصفحة تقرأ المانيسفت الخاص بالعيادة
    manifest: `/${tenantSlug}/manifest.json`,
    openGraph: {
      title: clinic.clinicName,
      siteName: clinic.clinicName,
      images: absoluteShareImageUrl
        ? [{ url: absoluteShareImageUrl, alt: `صورة ${clinic.clinicName}` }]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: clinic.clinicName,
      images: absoluteShareImageUrl ? [absoluteShareImageUrl] : [],
    },
  }
}

// 3. الـ Layout الأساسي
export default async function TenantLayout({ children, params }: LayoutProps) {
  const { tenantSlug } = await params

  // داتا العيادة هتيجي من الـ Cache بتاع Next.js مش من الباك إند تاني
  const clinic = await getClinicData(tenantSlug)

  if (!clinic) {
    notFound()
  }

  if (!clinic.isActive) {
    redirect(`/${tenantSlug}/suspended`)
  }

  return (
    <>
      <TenantInitializer clinic={clinic} />
      {children}
    </>
  )
}

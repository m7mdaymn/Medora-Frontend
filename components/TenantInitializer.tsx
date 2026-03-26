'use client'

import { IPublicClinic } from '@/types/public'
import { useEffect } from 'react'
import { useTenantStore } from '../store/useTenantStore'

export function TenantInitializer({ clinic }: { clinic: IPublicClinic }) {
  const setConfig = useTenantStore((state) => state.setTenantConfig)

  useEffect(() => {
    // بتخزن الاسم واللوجو واي حاجة هتحتاجها قدام
    setConfig({
      name: clinic.clinicName,
      logoUrl: clinic.logoUrl, // أو حسب اسم الحقل عندك في الـ API
    })
  }, [clinic, setConfig])

  return null // مفيش UI، ده مجرد كوبري بين السيرفر والكلينت
}

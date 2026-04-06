import { uploadClinicImageAction } from '@/actions/settings/upload-image'
import { uploadClinicLogoAction } from '@/actions/settings/upload-logo'
import { UpdateSettingsInput } from '@/validation/settings'
import { useRef, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'

interface UseClinicMediaUploadParams {
  tenantSlug: string
  form: UseFormReturn<UpdateSettingsInput>
}

export function useClinicMediaUpload({ tenantSlug, form }: UseClinicMediaUploadParams) {
  const logoInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  const validateUploadFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن لا يتعدى 2 ميجا بايت')
      return false
    }
    return true
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!validateUploadFile(file)) return

    setLogoPreviewUrl(URL.createObjectURL(file))

    const formData = new FormData()
    formData.append('file', file)

    setIsUploadingLogo(true)
    try {
      const res = await uploadClinicLogoAction(tenantSlug, formData)
      if (res.success && res.data?.publicUrl) {
        form.setValue('logoUrl', res.data.publicUrl, { shouldDirty: true })
        toast.success('تم رفع اللوجو بنجاح')
      } else {
        toast.error(res.message || 'فشل في رفع اللوجو')
      }
    } catch {
      toast.error('حدث خطأ أثناء الرفع')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!validateUploadFile(file)) return

    setImagePreviewUrl(URL.createObjectURL(file))

    const formData = new FormData()
    formData.append('file', file)

    setIsUploadingImage(true)
    try {
      const res = await uploadClinicImageAction(tenantSlug, formData)
      if (res.success && res.data?.publicUrl) {
        form.setValue('imgUrl', res.data.publicUrl, { shouldDirty: true })
        toast.success('تم رفع صورة الغلاف بنجاح')
      } else {
        toast.error(res.message || 'فشل في رفع صورة الغلاف')
      }
    } catch {
      toast.error('حدث خطأ أثناء الرفع')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const resetPreviewUrls = () => {
    setLogoPreviewUrl(null)
    setImagePreviewUrl(null)
  }

  return {
    logoInputRef,
    imageInputRef,
    isUploadingLogo,
    isUploadingImage,
    logoPreviewUrl,
    imagePreviewUrl,
    handleLogoUpload,
    handleImageUpload,
    resetPreviewUrls,
  }
}

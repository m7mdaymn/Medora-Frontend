// src/components/shared/clinic-image.tsx

import Image, { ImageProps } from 'next/image'
import { getFullImageUrl } from '@/lib/utils'
import { UserRound, Image as ImageIcon } from 'lucide-react'

interface ClinicImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined
  fallbackType?: 'doctor' | 'logo' | 'general'
}

export function ClinicImage({ src, fallbackType = 'general', alt, ...props }: ClinicImageProps) {
  const fullUrl = getFullImageUrl(src)

  if (!fullUrl) {
    return (
      <div className='flex h-full w-full items-center justify-center bg-muted text-muted-foreground/30'>
        {fallbackType === 'doctor' ? (
          <UserRound className='h-1/2 w-1/2' />
        ) : (
          <ImageIcon className='h-1/2 w-1/2' />
        )}
      </div>
    )
  }

  return (
    <Image
      {...props}
      src={fullUrl}
      alt={alt || 'Clinic Image'}
      unoptimized // 👈 محطوطة هنا مرة واحدة لكل السيستم
    />
  )
}

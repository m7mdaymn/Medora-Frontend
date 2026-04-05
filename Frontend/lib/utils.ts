import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { getApiBaseUrl } from './apiBaseUrl'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFullImageUrl(path: string | null | undefined): string {
  if (!path) return ''
  // لو اللينك كامل أو "وهمي/مؤقت" بتاع البريفيو، سيبه زي ما هو
  if (path.startsWith('http') || path.startsWith('blob:')) return path

  const baseUrl = getApiBaseUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  return `${baseUrl}${cleanPath}`
}
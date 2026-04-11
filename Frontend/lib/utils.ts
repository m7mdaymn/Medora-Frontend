import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFullImageUrl(path: string | null | undefined): string {
  if (!path) return ''
  // لو اللينك كامل أو "وهمي/مؤقت" بتاع البريفيو، سيبه زي ما هو
  if (path.startsWith('http') || path.startsWith('blob:')) return path

  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || ''
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  return `${baseUrl}${cleanPath}`
}

export function normalizeEgyptPhoneNumber(value: string | null | undefined): string {
  if (!value) return ''

  let digits = value.replace(/\D/g, '')
  if (!digits) return ''

  if (digits.startsWith('00')) {
    digits = digits.slice(2)
  }

  if (digits.startsWith('20')) {
    return digits
  }

  if (digits.startsWith('0')) {
    return `20${digits.slice(1)}`
  }

  if (digits.length === 10 && digits.startsWith('1')) {
    return `20${digits}`
  }

  return digits
}

export function formatEgyptPhoneForDisplay(value: string | null | undefined): string {
  const normalized = normalizeEgyptPhoneNumber(value)
  if (!normalized) return value || ''
  return normalized.startsWith('20') ? `+${normalized}` : `+${normalized}`
}

export function toWhatsAppLink(value: string | null | undefined): string {
  const normalized = normalizeEgyptPhoneNumber(value)
  return normalized ? `https://wa.me/${normalized}` : '#'
}

export function toTelLink(value: string | null | undefined): string {
  const normalized = normalizeEgyptPhoneNumber(value)
  return normalized ? `tel:+${normalized}` : '#'
}

export function normalizeSocialUrl(value: string | null | undefined): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

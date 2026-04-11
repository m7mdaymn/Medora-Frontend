import { IVisit } from '@/types/visit'

export function calculateAge(dateString: string | null | undefined): string | number {
  if (!dateString) return 'غير معروف'
  const today = new Date()
  const birthDate = new Date(dateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// استخراج الأمراض المزمنة
export function getChronicDiseases(profile: IVisit['chronicProfile']): string[] {
  if (!profile) return []
  const diseases: string[] = []
  if (profile.diabetes) diseases.push('سكر')
  if (profile.hypertension) diseases.push('ضغط')
  if (profile.cardiacDisease) diseases.push('قلب')
  if (profile.asthma) diseases.push('حساسية/ربو')
  if (profile.other) {
    diseases.push(profile.otherNotes ? profile.otherNotes : 'أخرى')
  }
  return diseases
}



import { IDoctorVisitConfig } from '@/types/doctor'

export const VISIT_CONFIG_LABELS: Record<keyof IDoctorVisitConfig, string> = {
  bloodPressure: 'الضغط',
  heartRate: 'النبض',
  temperature: 'الحرارة',
  weight: 'الوزن',
  height: 'الطول',
  bmi: 'مؤشر كتلة الجسم',
  bloodSugar: 'السكر',
  oxygenSaturation: 'نسبة الأكسجين',
  respiratoryRate: 'معدل التنفس',
}

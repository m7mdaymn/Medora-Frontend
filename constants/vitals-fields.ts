import { DoctorVisitFieldConfig } from '../types/visit'
import { ClinicalFormInput } from '../validation/visit'

export const vitalsFields: {
  name: keyof ClinicalFormInput
  label: string
  placeholder: string
  configKey: keyof DoctorVisitFieldConfig
}[] = [
  {
    name: 'bloodPressureSystolic',
    label: 'الضغط (Systolic)',
    placeholder: '120',
    configKey: 'bloodPressure',
  },
  {
    name: 'bloodPressureDiastolic',
    label: 'الضغط (Diastolic)',
    placeholder: '80',
    configKey: 'bloodPressure',
  },
  { name: 'heartRate', label: 'النبض (bpm)', placeholder: '75', configKey: 'heartRate' },
  { name: 'temperature', label: 'الحرارة (°C)', placeholder: '37', configKey: 'temperature' },
  { name: 'weight', label: 'الوزن (kg)', placeholder: '75', configKey: 'weight' },
  { name: 'height', label: 'الطول (cm)', placeholder: '175', configKey: 'height' },
  { name: 'bmi', label: 'مؤشر كتلة الجسم', placeholder: '24', configKey: 'bmi' },
  { name: 'bloodSugar', label: 'السكر', placeholder: '90', configKey: 'bloodSugar' },
  {
    name: 'oxygenSaturation',
    label: 'نسبة الأكسجين (%)',
    placeholder: '98',
    configKey: 'oxygenSaturation',
  },
  {
    name: 'respiratoryRate',
    label: 'معدل التنفس',
    placeholder: '16',
    configKey: 'respiratoryRate',
  },
]

export const notesFields: {
  name: keyof ClinicalFormInput
  label: string
  placeholder: string
  inputType?: 'textarea' | 'date'
}[] = [
  {
    name: 'complaint',
    label: 'الشكوى (Complaint)',
    placeholder: 'اكتب شكوى المريض...',
    inputType: 'textarea',
  },
  {
    name: 'diagnosis',
    label: 'التشخيص النهائي (Diagnosis)',
    placeholder: 'اكتب التشخيص هنا...',
    inputType: 'textarea',
  },
  {
    name: 'notes',
    label: 'ملاحظات إضافية',
    placeholder: 'أي ملاحظات أخرى...',
    inputType: 'textarea',
  },
  { name: 'followUpDate', label: 'ميعاد الاستشارة القادم', placeholder: '', inputType: 'date' }, // حددنا النوع هنا
]

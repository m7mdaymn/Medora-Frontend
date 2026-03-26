import * as v from 'valibot'

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/

export const WorkingHourSchema = v.object({
  dayOfWeek: v.picklist(
    ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    'يوم غير صالح',
  ),
  startTime: v.pipe(
    v.string('يجب أن يكون نصاً'),
    v.regex(timeRegex, 'صيغة الوقت يجب أن تكون HH:MM:SS'),
  ),
  endTime: v.pipe(
    v.string('يجب أن يكون نصاً'),
    v.regex(timeRegex, 'صيغة الوقت يجب أن تكون HH:MM:SS'),
  ),
  isActive: v.boolean('يجب تحديد حالة التفعيل'),
})

export const UpdateSettingsSchema = v.object({
  clinicName: v.pipe(
    v.string('اسم العيادة مطلوب'),
    v.nonEmpty('لا يمكن أن يكون اسم العيادة فارغاً'),
    v.maxLength(200, 'الحد الأقصى لاسم العيادة هو 200 حرف'),
  ),
  phone: v.optional(v.pipe(v.string(), v.maxLength(20, 'رقم الهاتف لا يجب أن يتجاوز 20 حرفاً'))),
  whatsAppSenderNumber: v.optional(v.string()),
  supportWhatsAppNumber: v.optional(v.string()),
  supportPhoneNumber: v.optional(v.string()),
  address: v.optional(v.pipe(v.string(), v.maxLength(500, 'العنوان طويل جداً'))),
  city: v.optional(v.pipe(v.string(), v.maxLength(100, 'اسم المدينة لا يجب أن يتجاوز 100 حرف'))),
  logoUrl: v.optional(v.string()),
  bookingEnabled: v.boolean('يجب تحديد حالة الحجز'),
  cancellationWindowHours: v.pipe(
    v.number('يجب إدخال عدد الساعات'),
    v.integer('يجب أن يكون رقماً صحيحاً'),
    v.minValue(0, 'الحد الأدنى 0'),
    v.maxValue(168, 'الحد الأقصى 168 ساعة'),
  ),
  workingHours: v.array(WorkingHourSchema, 'يجب إدخال أوقات العمل'),
})

export type UpdateSettingsInput = v.InferInput<typeof UpdateSettingsSchema>

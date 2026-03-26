import * as v from 'valibot'

export const UpdateFeatureFlagsSchema = v.object({
  onlineBooking: v.boolean(),
  whatsappAutomation: v.boolean(),
  pwaNotifications: v.boolean(),
  expensesModule: v.boolean(),
  advancedMedicalTemplates: v.boolean(),
  ratings: v.boolean(),
  export: v.boolean(),
})

export type UpdateFeatureFlagsInput = v.InferInput<typeof UpdateFeatureFlagsSchema>

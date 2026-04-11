export type UserRole =
  | 'SuperAdmin'
  | 'Worker'
  | 'ClinicOwner'
  | 'ClinicManager'
  | 'Receptionist'
  | 'Nurse'
  | 'Doctor'
  | 'Contractor'
  | 'Patient'

export interface BaseApiResponse<T> {
  success: boolean
  message: string
  data: T | null
  errors: Array<{ field: string; message: string }>
  meta: {
    timestamp: string
    requestId: string
  }
}

export interface IPaginatedData<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

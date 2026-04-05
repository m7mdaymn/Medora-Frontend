export type DoctorCompensationMode = 'Salary' | 'Percentage' | 'FixedPerVisit' | string

export interface IDoctorOverviewReportRow {
  doctorId: string
  doctorName: string
  visitsCount: number
  collectedAmount: number
  compensationMode: DoctorCompensationMode
  compensationValue: number
  estimatedCompensationAmount: number
}

export interface IClinicOverviewReport {
  fromDate: string
  toDate: string
  totalVisits: number
  examVisits: number
  consultationVisits: number
  bookingVisits: number
  walkInVisits: number
  selfServiceVisits: number
  totalInvoiced: number
  totalCollected: number
  totalRefunded: number
  totalExpenses: number
  netCashflow: number
  doctors: IDoctorOverviewReportRow[]
}

export interface IServiceSalesReportRow {
  serviceName: string
  quantity: number
  grossAmount: number
  invoicesCount: number
}

export interface IServicesSalesReport {
  fromDate: string
  toDate: string
  totalItemsSold: number
  grossSales: number
  rows: IServiceSalesReportRow[]
}

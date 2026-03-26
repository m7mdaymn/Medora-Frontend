// أرباح الدكتور الواحد
export interface IDoctorProfit {
  doctorId: string
  doctorName: string
  totalRevenue: number
  totalPaid: number
  visitCount: number
  // الحقول الجديدة 👈
  commissionPercent: number // نسبة عمولة الدكتور
  commissionAmount: number // المبلغ المستحق للدكتور
}

// التقرير الشامل (Profit)
export interface IProfitReport {
  from: string
  to: string
  totalRevenue: number
  totalPaid: number
  totalExpenses: number
  salaryExpenses: number
  nonSalaryExpenses: number
  netProfit: number
  invoiceCount: number
  expenseCount: number
  byDoctor: IDoctorProfit[] // هتستخدم الـ IDoctorProfit المحدثة فوق
}

// التقرير اليومي (Daily)
export interface IDailyFinance {
  date: string
  totalRevenue: number
  totalPaid: number
  totalUnpaid: number
  invoiceCount: number
  paymentCount: number
}

// التقرير الشهري (Monthly) - بيستخدم جوه السنوي كمان
export interface IMonthlyFinance {
  year: number
  month: number
  totalRevenue: number
  totalPaid: number
  totalExpenses: number
  // الحقول الجديدة 👈
  salaryExpenses: number // مصاريف مرتبات الفريق
  nonSalaryExpenses: number // إيجار، كهرباء، خامات.. الخ
  netProfit: number
  invoiceCount: number
}

export interface IYearlyFinance {
  year: number
  totalRevenue: number
  totalPaid: number
  totalExpenses: number
  // الحقول الجديدة 👈
  salaryExpenses: number
  nonSalaryExpenses: number
  netProfit: number
  invoiceCount: number
  months: IMonthlyFinance[]
}

import { getExpensesAction } from '../../../../../actions/finance/expenses'
import { PeriodFilter } from '../../../../../components/shared/period-filter'
import { DashboardHeader, DashboardShell } from '../../../../../components/shell'
import { ExpensesClient } from './expenses-client'

export default async function ExpensesPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ page?: string; from?: string; to?: string; category?: string }>
}) {
  const { tenantSlug } = await params
  const { page, from, to, category } = await searchParams
  const currentPage = Number(page) || 1

  const response = await getExpensesAction(tenantSlug, currentPage, 10, from, to, category)
  const expenses = response?.data?.items || []

  const pagination = {
    pageNumber: response?.data?.pageNumber || 1,
    totalPages: response?.data?.totalPages || 1,
    hasNextPage: response?.data?.hasNextPage || false,
    hasPreviousPage: response?.data?.hasPreviousPage || false,
  }



  return (
    <DashboardShell>
      <DashboardHeader heading='المصروفات' text='إدارة النفقات والمدفوعات الخارجية للعيادة'>
        <PeriodFilter />
      </DashboardHeader>

      <ExpensesClient initialExpenses={expenses} tenantSlug={tenantSlug} pagination={pagination} />
    </DashboardShell>
  )
}

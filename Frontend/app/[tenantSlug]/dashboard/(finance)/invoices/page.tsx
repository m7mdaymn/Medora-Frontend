import { getInvoicesAction } from '@/actions/finance/invoices'
import { PeriodFilter } from '../../../../../components/shared/period-filter'
import { DashboardHeader, DashboardShell } from '../../../../../components/shell'
import { InvoicesClient } from './invoices-client'

export default async function InvoicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>
  // ضفنا invoiceNumber هنا
  searchParams: Promise<{ page?: string; from?: string; to?: string; invoiceNumber?: string }>
}) {
  const { tenantSlug } = await params
  const { page, from, to, invoiceNumber } = await searchParams
  const currentPage = Number(page) || 1

  // لازم تتأكد إن الأكشن ده في فولدر الـ actions متعدل إنه يستقبل invoiceNumber ويبعته للباك إند
  const response = await getInvoicesAction(tenantSlug, currentPage, 10, from, to, invoiceNumber)
  const invoices = response?.data?.items || []

  const pagination = {
    pageNumber: response?.data?.pageNumber || 1,
    totalPages: response?.data?.totalPages || 1,
    hasNextPage: response?.data?.hasNextPage || false,
    hasPreviousPage: response?.data?.hasPreviousPage || false,
  }

  return (
    <DashboardShell>
      <DashboardHeader heading='الخزنة والتحصيل' text='إدارة مستحقات العيادة والتحصيلات'>
        <PeriodFilter />
      </DashboardHeader>

      <InvoicesClient initialInvoices={invoices} tenantSlug={tenantSlug} pagination={pagination} />
    </DashboardShell>
  )
}

import { ITenant } from '@/types/platform'
import { ISubscription } from '@/types/subscriptions'

const DAY_IN_MS = 1000 * 60 * 60 * 24

const toSafeDate = (value: string): Date | null => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const safeAmount = (value: number): number => (Number.isFinite(value) ? value : 0)

export function formatCurrencyEGP(value: number): string {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(safeAmount(value))
}

export function getTenantStatusLabel(status: ITenant['status'] | string): string {
  switch (status) {
    case 'Active':
      return 'نشط'
    case 'Suspended':
      return 'موقوف'
    case 'Blocked':
      return 'محظور'
    default:
      return 'غير معروف'
  }
}

export function getTenantStatusClass(status: ITenant['status'] | string): string {
  switch (status) {
    case 'Active':
      return 'bg-emerald-500/15 text-emerald-700 border-emerald-200'
    case 'Suspended':
      return 'bg-amber-500/15 text-amber-700 border-amber-200'
    case 'Blocked':
      return 'bg-rose-500/15 text-rose-700 border-rose-200'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

export function getSubscriptionStatusLabel(status: ISubscription['status'] | string): string {
  switch (status) {
    case 'Active':
      return 'نشط'
    case 'Pending':
      return 'معلق'
    case 'Expired':
      return 'منتهي'
    case 'Canceled':
      return 'ملغي'
    default:
      return 'غير معروف'
  }
}

export function getSubscriptionStatusClass(status: ISubscription['status'] | string): string {
  switch (status) {
    case 'Active':
      return 'bg-emerald-500/15 text-emerald-700 border-emerald-200'
    case 'Pending':
      return 'bg-blue-500/15 text-blue-700 border-blue-200'
    case 'Expired':
      return 'bg-orange-500/15 text-orange-700 border-orange-200'
    case 'Canceled':
      return 'bg-rose-500/15 text-rose-700 border-rose-200'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

export function getDaysUntil(dateValue: string): number {
  const date = toSafeDate(dateValue)
  if (!date) return Number.POSITIVE_INFINITY

  return Math.ceil((date.getTime() - Date.now()) / DAY_IN_MS)
}

export function getExpiringSubscriptions(
  subscriptions: ISubscription[],
  withinDays: number,
): ISubscription[] {
  return subscriptions
    .filter((subscription) => {
      if (subscription.status !== 'Active') return false
      const daysLeft = getDaysUntil(subscription.endDate)
      return daysLeft >= 0 && daysLeft <= withinDays
    })
    .sort((a, b) => getDaysUntil(a.endDate) - getDaysUntil(b.endDate))
}

export function summarizePlatform(tenants: ITenant[], subscriptions: ISubscription[]) {
  const activeTenants = tenants.filter((tenant) => tenant.status === 'Active').length
  const suspendedTenants = tenants.filter((tenant) => tenant.status === 'Suspended').length
  const blockedTenants = tenants.filter((tenant) => tenant.status === 'Blocked').length

  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === 'Active',
  ).length
  const pendingSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === 'Pending',
  ).length
  const expiredSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === 'Expired',
  ).length
  const canceledSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === 'Canceled',
  ).length

  const totalRevenue = subscriptions.reduce((sum, subscription) => sum + safeAmount(subscription.amount), 0)
  const paidRevenue = subscriptions
    .filter((subscription) => subscription.isPaid)
    .reduce((sum, subscription) => sum + safeAmount(subscription.amount), 0)
  const unpaidRevenue = Math.max(0, totalRevenue - paidRevenue)

  const expiringIn14Days = getExpiringSubscriptions(subscriptions, 14).length
  const overduePayments = subscriptions.filter((subscription) => !subscription.isPaid).length

  return {
    tenants: {
      total: tenants.length,
      active: activeTenants,
      suspended: suspendedTenants,
      blocked: blockedTenants,
    },
    subscriptions: {
      total: subscriptions.length,
      active: activeSubscriptions,
      pending: pendingSubscriptions,
      expired: expiredSubscriptions,
      canceled: canceledSubscriptions,
      expiringIn14Days,
      overduePayments,
    },
    revenue: {
      total: totalRevenue,
      paid: paidRevenue,
      unpaid: unpaidRevenue,
      collectionRate: totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0,
    },
  }
}

export function buildTenantNameMap(tenants: ITenant[]): Map<string, string> {
  return new Map(tenants.map((tenant) => [tenant.id, tenant.name]))
}

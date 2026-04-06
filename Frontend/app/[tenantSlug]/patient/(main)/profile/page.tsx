'use client'

import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { usePatientAuthStore } from '@/store/usePatientAuthStore'
import {
  getPatientProfileAppAction,
  getPatientSelfServiceRequestsAppAction,
} from '@/actions/patient-app/profile'
import { User, Phone, Calendar, MapPin, Info, LucideIcon, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ProfileSwitcher } from '@/components/patient/profile-switcher'
import { PatientLogoutButton } from '@/components/auth/PatientLogoutButton'
import Link from 'next/link'

export default function PatientProfilePage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const authData = usePatientAuthStore((state) => state.tenants[tenantSlug])
  const activeProfileId = authData?.activeProfileId

  // 1. جلب بيانات البروفايل (الأساسية فقط)
  const { data: profileRes, isLoading: loadingProfile } = useSWR(
    activeProfileId ? ['patientFullProfile', tenantSlug, activeProfileId] : null,
    () => getPatientProfileAppAction(tenantSlug, activeProfileId!),
  )

  const { data: selfServiceRes, isLoading: loadingSelfService } = useSWR(
    activeProfileId ? ['patientSelfServiceRequests', tenantSlug, activeProfileId] : null,
    () => getPatientSelfServiceRequestsAppAction(tenantSlug, activeProfileId!),
  )

  const profile = profileRes?.data
  const selfServiceRequests = selfServiceRes?.data || []

  if (!activeProfileId) return null

  return (
    <div
      className='max-w-full overflow-x-hidden p-4 pb-24 space-y-8 animate-in fade-in duration-500'
      dir='rtl'
    >
      {/* الهيدر */}
      <div className='flex items-center justify-between gap-2'>
        <h2 className='text-2xl font-bold tracking-tight text-foreground'>حسابي</h2>
        <div className='shrink-0'>
          <ProfileSwitcher tenantSlug={tenantSlug} />
        </div>
      </div>

      {/* المعلومات الشخصية */}
      <div className='space-y-3'>
        <h3 className='text-[10px] font-bold text-muted-foreground flex items-center gap-2 px-1 uppercase tracking-[0.2em]'>
          <Info className='w-3 h-3' /> البيانات الشخصية
        </h3>
        <Card className='border-border/40 shadow-sm overflow-hidden rounded-2xl bg-background'>
          <div className='divide-y divide-border/40'>
            <InfoItem icon={User} label='الاسم' value={profile?.name} loading={loadingProfile} />
            <InfoItem icon={Phone} label='الهاتف' value={profile?.phone} loading={loadingProfile} />
            <InfoItem
              icon={Calendar}
              label='تاريخ الميلاد'
              value={
                profile?.dateOfBirth
                  ? new Date(profile.dateOfBirth).toLocaleDateString('ar-EG')
                  : '---'
              }
              loading={loadingProfile}
            />
            <InfoItem
              icon={MapPin}
              label='العنوان'
              value={profile?.address || 'غير مسجل'}
              loading={loadingProfile}
            />
          </div>
        </Card>
      </div>

      <div className='space-y-3'>
        <div className='flex items-center justify-between gap-2'>
          <h3 className='text-[10px] font-bold text-muted-foreground flex items-center gap-2 px-1 uppercase tracking-[0.2em]'>
            <ShieldCheck className='w-3 h-3' /> حالة طلبات الدفع الذاتي
          </h3>
          <Button asChild size='sm' variant='outline'>
            <Link href={`/${tenantSlug}/patient/request`}>طلب جديد</Link>
          </Button>
        </div>
        <Card className='border-border/40 shadow-sm overflow-hidden rounded-2xl bg-background'>
          {loadingSelfService ? (
            <div className='p-4 space-y-2'>
              <Skeleton className='h-10 w-full rounded-lg' />
              <Skeleton className='h-10 w-full rounded-lg' />
            </div>
          ) : selfServiceRequests.length === 0 ? (
            <div className='p-4 space-y-2'>
              <p className='text-sm text-muted-foreground'>لا توجد طلبات دفع ذاتي حتى الآن.</p>
              <Button asChild size='sm' variant='outline'>
                <Link href={`/${tenantSlug}/patient/request`}>ابدأ أول طلب</Link>
              </Button>
            </div>
          ) : (
            <div className='divide-y divide-border/40'>
              {selfServiceRequests.slice(0, 3).map((request) => (
                <div key={request.id} className='p-4 flex items-center justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='text-sm font-bold text-foreground truncate'>{request.serviceName}</p>
                    <p className='text-xs text-muted-foreground'>
                      {new Date(request.requestedDate).toLocaleDateString('ar-EG')} •{' '}
                      {request.requestedTime || '--'}
                    </p>
                  </div>
                  <SelfServiceStatusBadge status={request.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ملاحظات الحساب (لو موجودة) */}
      {profile?.notes && (
        <div className='p-4 bg-muted/30 rounded-2xl border border-dashed border-border/60'>
          <p className='text-[10px] font-bold text-muted-foreground uppercase mb-2'>
            ملاحظات إضافية
          </p>
          <p className='text-xs text-muted-foreground italic leading-relaxed'>{profile.notes}</p>
        </div>
      )}

      {/* تسجيل الخروج */}
      <div className='pt-4'>
        <PatientLogoutButton />
      </div>
    </div>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: LucideIcon
  label: string
  value?: string | null
  loading: boolean
}) {
  return (
    <div className='flex items-center justify-between p-4 transition-colors hover:bg-muted/5'>
      <div className='flex items-center gap-3'>
        <div className='p-2 rounded-xl bg-muted/40 border border-border/20'>
          <Icon className='w-3.5 h-3.5 text-muted-foreground' />
        </div>
        <div className='flex flex-col'>
          <span className='text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter'>
            {label}
          </span>
          {loading ? (
            <Skeleton className='h-4 w-28 mt-1' />
          ) : (
            <span className='text-sm font-bold text-foreground'>{value || '---'}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function SelfServiceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'PendingPaymentReview':
      return <Badge variant='outline'>قيد مراجعة الدفع</Badge>
    case 'PaymentApproved':
      return (
        <Badge variant='outline' className='bg-emerald-500/5 text-emerald-600 border-emerald-500/20'>
          تم اعتماد الدفع
        </Badge>
      )
    case 'ReuploadRequested':
      return (
        <Badge variant='outline' className='bg-amber-500/5 text-amber-600 border-amber-500/20'>
          مطلوب إعادة الإثبات
        </Badge>
      )
    case 'ConvertedToQueueTicket':
      return <Badge variant='outline'>تحول إلى تذكرة</Badge>
    case 'ConvertedToBooking':
      return <Badge variant='outline'>تحول إلى حجز</Badge>
    case 'Rejected':
      return (
        <Badge variant='outline' className='bg-destructive/5 text-destructive border-destructive/20'>
          مرفوض
        </Badge>
      )
    case 'Expired':
      return <Badge variant='outline'>منتهي الصلاحية</Badge>
    default:
      return <Badge variant='outline'>{status}</Badge>
  }
}

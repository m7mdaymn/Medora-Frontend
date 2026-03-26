'use client'

import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { usePatientAuthStore } from '@/store/usePatientAuthStore'
import {
  getPatientProfileAppAction,
  getPatientCreditBalanceAction,
} from '@/actions/patient-app/profile'
import { User, Phone, Calendar, MapPin, Wallet, ShieldCheck, Info, LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ProfileSwitcher } from '@/components/patient/profile-switcher'
import { PatientLogoutButton } from '@/components/auth/PatientLogoutButton'

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

  // 2. جلب رصيد المحفظة
  const { data: balanceRes, isLoading: loadingBalance } = useSWR(
    activeProfileId ? ['patientBalance', tenantSlug, activeProfileId] : null,
    () => getPatientCreditBalanceAction(tenantSlug, activeProfileId!),
  )

  const profile = profileRes?.data
  const balance = balanceRes?.data?.balance || 0

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

      {/* كارت المحفظة (Vercel Black Style) */}
      <div className='space-y-3'>
        <h3 className='text-[10px] font-bold text-muted-foreground flex items-center gap-2 px-1 uppercase tracking-[0.2em]'>
          <Wallet className='w-3 h-3' /> رصيد المحفظة
        </h3>
        {loadingBalance ? (
          <Skeleton className='h-36 w-full rounded-3xl' />
        ) : (
          <div className='relative overflow-hidden rounded-3xl bg-[#0A0A0A] p-6 text-white shadow-2xl'>
            {/* Ambient Light Effect */}
            <div className='absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl' />

            <div className='relative z-10 flex flex-col h-full justify-between gap-8'>
              <div className='flex items-center justify-between'>
                <span className='text-[10px] font-medium opacity-50 tracking-widest uppercase'>
                  الرصيد المتاح
                </span>
                <ShieldCheck className='w-5 h-5 text-emerald-500 opacity-80' />
              </div>

              <div className='flex items-baseline gap-2'>
                <span className='text-5xl font-bold tracking-tighter italic'>
                  {balance.toLocaleString()}
                </span>
                <span className='text-sm font-medium opacity-40'>ج.م</span>
              </div>

              <div className='text-[10px] font-medium opacity-30'>
                • يتم تحديث الرصيد تلقائياً بعد كل عملية تسوية
              </div>
            </div>
          </div>
        )}
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

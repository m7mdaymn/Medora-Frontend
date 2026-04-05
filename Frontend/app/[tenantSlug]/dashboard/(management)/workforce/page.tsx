'use client'

import { getDoctorsAction } from '@/actions/doctor/get-doctors'
import {
  createAbsenceAction,
  createAttendanceAction,
  createDoctorCompensationRuleAction,
  generateDailyClosingAction,
  listAbsenceAction,
  listAttendanceAction,
  listDailyClosingSnapshotsAction,
} from '@/actions/workforce/workforce'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useParams } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

const COMPENSATION_MODES = ['Salary', 'Percentage', 'FixedPerVisit'] as const

export default function WorkforcePage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const [doctorId, setDoctorId] = useState('')
  const [compensationMode, setCompensationMode] = useState<(typeof COMPENSATION_MODES)[number]>('Salary')
  const [compensationValue, setCompensationValue] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10))

  const [attendanceDoctorId, setAttendanceDoctorId] = useState('')
  const [attendanceBranchId, setAttendanceBranchId] = useState('')

  const [absenceDoctorId, setAbsenceDoctorId] = useState('')
  const [absenceFrom, setAbsenceFrom] = useState(new Date().toISOString().slice(0, 10))
  const [absenceTo, setAbsenceTo] = useState(new Date().toISOString().slice(0, 10))
  const [absenceReason, setAbsenceReason] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: doctorsRes } = useSWR(['doctors-for-workforce', tenantSlug], () =>
    getDoctorsAction(tenantSlug),
  )

  const { data: attendanceRes, isLoading: loadingAttendance, mutate: mutateAttendance } = useSWR(
    ['workforce-attendance', tenantSlug],
    () => listAttendanceAction(tenantSlug),
  )

  const { data: absenceRes, isLoading: loadingAbsence, mutate: mutateAbsence } = useSWR(
    ['workforce-absence', tenantSlug],
    () => listAbsenceAction(tenantSlug),
  )

  const { data: closingRes, isLoading: loadingClosing, mutate: mutateClosing } = useSWR(
    ['workforce-closing', tenantSlug],
    () => listDailyClosingSnapshotsAction(tenantSlug),
  )

  const doctors = useMemo(() => doctorsRes?.doctors ?? [], [doctorsRes?.doctors])
  const attendance = attendanceRes?.data || []
  const absences = absenceRes?.data || []
  const closings = closingRes?.data || []

  const defaultDoctorId = useMemo(() => doctors[0]?.id || '', [doctors])

  const submitCompensation = async (event: FormEvent) => {
    event.preventDefault()

    const selectedDoctorId = doctorId || defaultDoctorId
    const parsedValue = Number(compensationValue)

    if (!selectedDoctorId) {
      toast.error('اختر طبيباً أولاً')
      return
    }

    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
      toast.error('قيمة التعاقد غير صحيحة')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await createDoctorCompensationRuleAction(tenantSlug, selectedDoctorId, {
        mode: compensationMode,
        value: parsedValue,
        effectiveFrom,
      })

      if (!response.success) {
        toast.error(response.message || 'فشل حفظ قاعدة التعاقد')
        return
      }

      toast.success('تم حفظ قاعدة التعاقد')
      setCompensationValue('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitAttendance = async (event: FormEvent) => {
    event.preventDefault()

    const selectedDoctorId = attendanceDoctorId || defaultDoctorId
    if (!selectedDoctorId) {
      toast.error('اختر طبيباً لتسجيل الحضور')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await createAttendanceAction(tenantSlug, {
        doctorId: selectedDoctorId,
        branchId: attendanceBranchId || undefined,
      })

      if (!response.success) {
        toast.error(response.message || 'فشل تسجيل الحضور')
        return
      }

      toast.success('تم تسجيل الحضور')
      await mutateAttendance()
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitAbsence = async (event: FormEvent) => {
    event.preventDefault()

    const selectedDoctorId = absenceDoctorId || defaultDoctorId
    if (!selectedDoctorId || !absenceReason.trim()) {
      toast.error('اختر الطبيب وأدخل سبب الغياب')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await createAbsenceAction(tenantSlug, {
        doctorId: selectedDoctorId,
        fromDate: absenceFrom,
        toDate: absenceTo,
        reason: absenceReason.trim(),
      })

      if (!response.success) {
        toast.error(response.message || 'فشل تسجيل الغياب')
        return
      }

      toast.success('تم تسجيل الغياب')
      setAbsenceReason('')
      await mutateAbsence()
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateDailyClosing = async () => {
    const response = await generateDailyClosingAction(tenantSlug)
    if (!response.success) {
      toast.error(response.message || 'فشل توليد الإقفال اليومي')
      return
    }

    toast.success('تم توليد الإقفال اليومي')
    await mutateClosing()
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading='شئون العاملين'
        text='التعاقدات، الحضور والغياب، والإقفال اليومي'
      >
        <Button variant='outline' onClick={() => void generateDailyClosing()}>
          توليد إقفال اليوم
        </Button>
      </DashboardHeader>

      <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
        <Card className='rounded-2xl border-border/50 p-4'>
          <h3 className='text-sm font-bold mb-3'>قاعدة تعاقد طبيب</h3>
          <form onSubmit={submitCompensation} className='space-y-3'>
            <div className='space-y-2'>
              <Label>الطبيب</Label>
              <select
                className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
                value={doctorId}
                onChange={(event) => setDoctorId(event.target.value)}
              >
                <option value=''>اختر الطبيب</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-2'>
              <Label>نمط التعاقد</Label>
              <select
                className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
                value={compensationMode}
                onChange={(event) =>
                  setCompensationMode(event.target.value as (typeof COMPENSATION_MODES)[number])
                }
              >
                {COMPENSATION_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-2'>
              <Label>القيمة</Label>
              <Input
                type='number'
                value={compensationValue}
                onChange={(event) => setCompensationValue(event.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label>ساري من</Label>
              <Input
                type='date'
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
              />
            </div>

            <Button type='submit' disabled={isSubmitting}>
              حفظ القاعدة
            </Button>
          </form>
        </Card>

        <Card className='rounded-2xl border-border/50 p-4'>
          <h3 className='text-sm font-bold mb-3'>تسجيل حضور</h3>
          <form onSubmit={submitAttendance} className='space-y-3'>
            <div className='space-y-2'>
              <Label>الطبيب</Label>
              <select
                className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
                value={attendanceDoctorId}
                onChange={(event) => setAttendanceDoctorId(event.target.value)}
              >
                <option value=''>اختر الطبيب</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-2'>
              <Label>Branch Id (اختياري)</Label>
              <Input
                value={attendanceBranchId}
                onChange={(event) => setAttendanceBranchId(event.target.value)}
              />
            </div>

            <Button type='submit' disabled={isSubmitting}>
              تسجيل حضور
            </Button>
          </form>
        </Card>

        <Card className='rounded-2xl border-border/50 p-4'>
          <h3 className='text-sm font-bold mb-3'>تسجيل غياب</h3>
          <form onSubmit={submitAbsence} className='space-y-3'>
            <div className='space-y-2'>
              <Label>الطبيب</Label>
              <select
                className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
                value={absenceDoctorId}
                onChange={(event) => setAbsenceDoctorId(event.target.value)}
              >
                <option value=''>اختر الطبيب</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className='grid grid-cols-2 gap-2'>
              <div className='space-y-2'>
                <Label>من</Label>
                <Input type='date' value={absenceFrom} onChange={(event) => setAbsenceFrom(event.target.value)} />
              </div>
              <div className='space-y-2'>
                <Label>إلى</Label>
                <Input type='date' value={absenceTo} onChange={(event) => setAbsenceTo(event.target.value)} />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>السبب</Label>
              <Input value={absenceReason} onChange={(event) => setAbsenceReason(event.target.value)} />
            </div>

            <Button type='submit' disabled={isSubmitting}>
              تسجيل غياب
            </Button>
          </form>
        </Card>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
        <Card className='rounded-2xl border-border/50 p-4 space-y-3'>
          <h3 className='text-sm font-bold'>سجل الحضور</h3>
          {loadingAttendance ? (
            <Skeleton className='h-16 w-full rounded-xl' />
          ) : attendance.length === 0 ? (
            <p className='text-sm text-muted-foreground'>لا توجد سجلات حضور.</p>
          ) : (
            <div className='space-y-2'>
              {attendance.map((record) => (
                <div key={record.id} className='rounded-lg border border-border/40 p-2 text-xs'>
                  {record.doctorName || record.employeeName || 'غير محدد'} • دخول:{' '}
                  {new Date(record.checkInAt).toLocaleString('ar-EG')}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className='rounded-2xl border-border/50 p-4 space-y-3'>
          <h3 className='text-sm font-bold'>سجل الغياب</h3>
          {loadingAbsence ? (
            <Skeleton className='h-16 w-full rounded-xl' />
          ) : absences.length === 0 ? (
            <p className='text-sm text-muted-foreground'>لا توجد سجلات غياب.</p>
          ) : (
            <div className='space-y-2'>
              {absences.map((record) => (
                <div key={record.id} className='rounded-lg border border-border/40 p-2 text-xs'>
                  {record.doctorName || record.employeeName || 'غير محدد'} • {record.reason} •{' '}
                  {new Date(record.fromDate).toLocaleDateString('ar-EG')} -{' '}
                  {new Date(record.toDate).toLocaleDateString('ar-EG')}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className='rounded-2xl border-border/50 p-4 space-y-3'>
        <h3 className='text-sm font-bold'>الإقفالات اليومية</h3>
        {loadingClosing ? (
          <Skeleton className='h-16 w-full rounded-xl' />
        ) : closings.length === 0 ? (
          <p className='text-sm text-muted-foreground'>لا توجد إقفالات مسجلة.</p>
        ) : (
          <div className='space-y-2'>
            {closings.map((closing) => (
              <div key={closing.id} className='rounded-lg border border-border/40 p-3 text-xs'>
                {new Date(closing.snapshotDate).toLocaleDateString('ar-EG')} • صافي التدفق:{' '}
                {closing.netCashFlow.toLocaleString('ar-EG')} ج.م • زيارات مكتملة: {closing.visitsCompleted}
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardShell>
  )
}

'use client'

import { getDoctorsAction } from '@/actions/doctor/get-doctors'
import { getAllStaffAction } from '@/actions/staff/get-staff'
import {
  createAbsenceAction,
  createAttendanceAction,
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

type WorkforceWorkerOption = {
  key: string
  type: 'doctor' | 'employee'
  id: string
  label: string
  roleLabel: string
}

function parseWorkerSelection(value: string): { doctorId?: string; employeeId?: string } | null {
  if (!value) return null

  const [type, id] = value.split(':')
  if (!type || !id) return null

  if (type === 'doctor') return { doctorId: id }
  if (type === 'employee') return { employeeId: id }
  return null
}

export default function WorkforcePage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const [attendanceWorkerKey, setAttendanceWorkerKey] = useState('')
  const [attendanceBranchId, setAttendanceBranchId] = useState('')

  const [absenceWorkerKey, setAbsenceWorkerKey] = useState('')
  const [absenceFrom, setAbsenceFrom] = useState(new Date().toISOString().slice(0, 10))
  const [absenceTo, setAbsenceTo] = useState(new Date().toISOString().slice(0, 10))
  const [absenceReason, setAbsenceReason] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: doctorsRes } = useSWR(['doctors-for-workforce', tenantSlug], () =>
    getDoctorsAction(tenantSlug),
  )

  const { data: staffRes } = useSWR(['staff-for-workforce', tenantSlug], () =>
    getAllStaffAction(tenantSlug),
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
  const staffMembers = useMemo(
    () => (staffRes ?? []).filter((member) => member.isEnabled),
    [staffRes],
  )

  const workerOptions = useMemo<WorkforceWorkerOption[]>(
    () => [
      ...doctors.map((doctor) => ({
        key: `doctor:${doctor.id}`,
        type: 'doctor' as const,
        id: doctor.id,
        label: `د. ${doctor.name}`,
        roleLabel: 'طبيب',
      })),
      ...staffMembers.map((member) => ({
        key: `employee:${member.id}`,
        type: 'employee' as const,
        id: member.id,
        label: member.name,
        roleLabel: member.role || 'موظف',
      })),
    ],
    [doctors, staffMembers],
  )

  const attendance = attendanceRes?.data || []
  const absences = absenceRes?.data || []
  const closings = closingRes?.data || []

  const defaultWorkerKey = useMemo(() => workerOptions[0]?.key || '', [workerOptions])

  const submitAttendance = async (event: FormEvent) => {
    event.preventDefault()

    const selectedWorkerKey = attendanceWorkerKey || defaultWorkerKey
    const selectedWorker = parseWorkerSelection(selectedWorkerKey)

    if (!selectedWorker) {
      toast.error('اختر عاملاً لتسجيل الحضور')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await createAttendanceAction(tenantSlug, {
        ...selectedWorker,
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

    const selectedWorkerKey = absenceWorkerKey || defaultWorkerKey
    const selectedWorker = parseWorkerSelection(selectedWorkerKey)

    if (!selectedWorker || !absenceReason.trim()) {
      toast.error('اختر العامل وأدخل سبب الغياب')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await createAbsenceAction(tenantSlug, {
        ...selectedWorker,
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
        text='الحضور والغياب والإقفال اليومي'
      >
        <Button variant='outline' onClick={() => void generateDailyClosing()}>
          توليد إقفال اليوم
        </Button>
      </DashboardHeader>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
        <Card className='rounded-2xl border-border/50 p-4'>
          <h3 className='text-sm font-bold mb-3'>تسجيل حضور</h3>
          <form onSubmit={submitAttendance} className='space-y-3'>
            <div className='space-y-2'>
              <Label>العامل</Label>
              <select
                className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
                value={attendanceWorkerKey}
                onChange={(event) => setAttendanceWorkerKey(event.target.value)}
              >
                <option value=''>اختر العامل</option>
                {workerOptions.map((worker) => (
                  <option key={worker.key} value={worker.key}>
                    {worker.label} ({worker.roleLabel})
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
              <Label>العامل</Label>
              <select
                className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
                value={absenceWorkerKey}
                onChange={(event) => setAbsenceWorkerKey(event.target.value)}
              >
                <option value=''>اختر العامل</option>
                {workerOptions.map((worker) => (
                  <option key={worker.key} value={worker.key}>
                    {worker.label} ({worker.roleLabel})
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

import { getMyPatientsAction } from '@/actions/doctor/get-my-patients'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, User, Users } from 'lucide-react'
import Link from 'next/link'
import { GenericPagination } from '../../../../../components/shared/pagination'
import { PatientSearch } from './patient-search'

// دالة صغيرة لحساب السن من تاريخ الميلاد
function getAge(dateString: string) {
  if (!dateString) return 'غير محدد'
  const today = new Date()
  const birthDate = new Date(dateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return `${age} سنة`
}

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DoctorPatientsPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const resolvedSearchParams = await searchParams

  const page = Number(resolvedSearchParams.page) || 1
  const search = (resolvedSearchParams.search as string) || ''

  // جلب الداتا من الأكشن
  const res = await getMyPatientsAction(tenantSlug, page, search, 10)
  const paginatedData = res.data
  const patients = paginatedData?.items || []

  return (
    <DashboardShell>
      <DashboardHeader heading='سجل مرضاي' text='قائمة المرضى الذين قمت بالكشف عليهم سابقاً.' />
      <PatientSearch />
      <div>
        {patients.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20 text-center'>
            <Users className='w-12 h-12 text-muted-foreground/50 mb-4' />
            <h3 className='text-lg font-bold text-foreground'>لا يوجد مرضى</h3>
            <p className='text-muted-foreground mt-1'>
              {search
                ? 'لم يتم العثور على مريض بهذا الاسم.'
                : 'لم تقم بالكشف على أي مريض حتى الآن.'}
            </p>
          </div>
        ) : (
          <div className='rounded-2xl overflow-hidden border '>
            <Table>
              <TableHeader className='bg-muted/50 h-12'>
                <TableRow>
                  <TableHead className='text-right '>المريض</TableHead>
                  <TableHead className='text-right'>السن</TableHead>
                  <TableHead className='text-right'>النوع</TableHead>
                  <TableHead className='text-right'>الهاتف</TableHead>
                  <TableHead className='text-left w-45'>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id} className='hover:bg-muted/30 transition-colors'>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <div className='flex h-9 w-9 items-center justify-center rounded-full border bg-background'>
                          <User className='h-4 w-4 text-muted-foreground' />
                        </div>
                        <div className='flex flex-col'>
                          <span className='font-bold text-foreground'>{patient.name}</span>
                          {patient.username && (
                            <span className='text-xs text-muted-foreground' dir='ltr'>
                              {patient.username}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {getAge(patient.dateOfBirth)}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {patient.gender === 'Male' ? 'ذكر' : 'أنثى'}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>{patient.phone || '-'}</TableCell>
                    <TableCell className='text-left'>
                      <Button
                        variant='outline'
                        size='sm'
                        asChild
                        className='hover:bg-primary/5 hover:text-primary'
                      >
                        <Link href={`/${tenantSlug}/dashboard/doctor/patients/${patient.id}`}>
                          عرض السجل
                          <ArrowLeft className='w-4 h-4 ml-2' />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {paginatedData && paginatedData.totalPages > 1 && (
          <div className='p-4 border-t'>
            <GenericPagination
              currentPage={paginatedData.pageNumber}
              totalPages={paginatedData.totalPages}
              hasNextPage={paginatedData.hasNextPage}
              hasPreviousPage={paginatedData.hasPreviousPage}
            />
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

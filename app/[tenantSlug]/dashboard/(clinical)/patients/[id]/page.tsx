import { getPatientProfileAction } from '@/actions/patient/get-patient-profile'
import { GenericPagination } from '@/components/shared/pagination'
import { DashboardShell } from '@/components/shell'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, ChevronLeft, User } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '../../../../../../components/ui/button'
import { PatientInfoCard } from './patient-info-card'
import { SubProfilesList } from './sub-profiles-list'
import { VisitsTimeline } from './visits-timeline'

interface PageProps {
  params: Promise<{ tenantSlug: string; id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PatientProfilePage({ params, searchParams }: PageProps) {
  const { tenantSlug, id } = await params
  const queryParams = await searchParams
  const currentPage = Number(queryParams.page) || 1

  const { success, patient, visits, pagination } = await getPatientProfileAction(
    id,
    tenantSlug,
    currentPage,
    5,
  )

  if (!success || !patient) notFound()

  return (
    <DashboardShell>
      {/* Header with Quick Actions stacked on mobile */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2'>
        <div>
          <h1 className='text-2xl md:text-3xl font-bold tracking-tight text-foreground'>
            الملف الطبي
          </h1>
          <p className='text-sm text-muted-foreground mt-1'>إدارة السجل الطبي الشامل للمريض</p>
        </div>
        <Button variant={'ghost'}>
          <Link href={`/${tenantSlug}/dashboard/patients`} className='flex space-x-2 items-center'>
            صفحة المرضى
            <ChevronLeft />
          </Link>
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        {/* العمود الأيمن (كارت المريض) */}
        <div className='lg:col-span-4 xl:col-span-3'>
          <div className='sticky top-4'>
            <PatientInfoCard patient={patient} />
          </div>
        </div>

        {/* العمود الأيسر (التبويبات) */}
        <div className='lg:col-span-8 xl:col-span-9'>
          <Tabs defaultValue='visits' className='w-full'>
            {/* Tabs List - Scrollable on Mobile, Clean Underlines */}
            <div className='border-b border-border/50'>
              <TabsList className='w-full justify-start bg-transparent h-auto p-0 gap-4 md:gap-6 overflow-x-auto flex-nowrap no-scrollbar'>
                <TabsTrigger
                  value='visits'
                  className='whitespace-nowrap data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary  px-1 pb-3 pt-2 text-sm font-semibold text-muted-foreground data-[state=active]:text-foreground transition-all '
                >
                  <Activity className='ml-2 h-4 w-4 shrink-0' /> السجل والزيارات
                </TabsTrigger>
                <TabsTrigger
                  value='subProfiles'
                  className='whitespace-nowrap data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary  px-1 pb-3 pt-2 text-sm font-semibold text-muted-foreground data-[state=active]:text-foreground transition-all'
                >
                  <User className='ml-2 h-4 w-4 shrink-0' /> العائلة
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tabs Content */}
            <div className='mt-6'>
              <TabsContent value='visits' className='outline-none m-0'>
                <VisitsTimeline visits={visits || []} tenantSlug={tenantSlug} />

                {pagination && pagination.totalPages > 1 && (
                  <div className='mt-6 pt-4 flex justify-center md:justify-end'>
                    <GenericPagination
                      currentPage={pagination.pageNumber}
                      totalPages={pagination.totalPages}
                      hasNextPage={pagination.hasNextPage}
                      hasPreviousPage={pagination.hasPreviousPage}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value='subProfiles' className='outline-none m-0'>
                <SubProfilesList subProfiles={patient.subProfiles || []} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </DashboardShell>
  )
}

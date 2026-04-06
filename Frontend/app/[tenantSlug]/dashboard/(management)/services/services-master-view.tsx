'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IPaginatedData } from '@/types/api'
import { IDoctor } from '@/types/doctor'
import { IClinicService, IDoctorServiceLink } from '@/types/services'

// بنستدعي الشاشتين النضاف اللي عملناهم
import { ClinicServicesView } from './clinic-services-view'
import { DoctorServicesView } from './doctor-services-view'

interface Props {
  tenantSlug: string
  paginatedCatalog: IPaginatedData<IClinicService> | null
  doctors: IDoctor[]
  currentLinks: IDoctorServiceLink[]
  selectedDoctorId?: string
  defaultTab: string
}

export function ServicesMasterView({
  tenantSlug,
  paginatedCatalog,
  doctors,
  currentLinks,
  selectedDoctorId,
  defaultTab,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <Tabs defaultValue={defaultTab} onValueChange={handleTabChange} className='w-full' dir='rtl'>
      <div className='flex items-center mb-6'>
        <TabsList className='grid w-100 grid-cols-2 h-11'>
          <TabsTrigger value='catalog' className='flex items-center gap-2 font-bold'>
            الكتالوج المركزي
          </TabsTrigger>
          <TabsTrigger value='pricing' className='flex items-center gap-2 font-bold'>
            تسعير الأطباء
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value='catalog' className='mt-0 outline-none animate-in fade-in duration-300'>
        <ClinicServicesView paginatedData={paginatedCatalog} tenantSlug={tenantSlug} />
      </TabsContent>

      <TabsContent value='pricing' className='mt-0 outline-none animate-in fade-in duration-300'>
        <DoctorServicesView
          tenantSlug={tenantSlug}
          doctors={doctors}
          catalogServices={paginatedCatalog?.items || []}
          currentLinks={currentLinks}
          selectedDoctorId={selectedDoctorId}
        />
      </TabsContent>
    </Tabs>
  )
}

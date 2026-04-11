'use client'

import { getPatientsAction } from '@/actions/patient/getPatients'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { IPatient } from '@/types/patient'
import { Check, ChevronsUpDown, Loader2, UserPlus } from 'lucide-react'
import * as React from 'react'
import useSWR from 'swr'
import { useDebounce } from 'use-debounce'
import { AddPatientModal } from '../app/[tenantSlug]/dashboard/(clinical)/patients/add-patient-modal'

interface PatientSearchProps {
  tenantSlug: string
  onSelect: (patient: IPatient) => void
  selectedPatientId?: string
}

export function PatientSearch({ tenantSlug, onSelect, selectedPatientId }: PatientSearchProps) {
  const [open, setOpen] = React.useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedPatient, setSelectedPatient] = React.useState<IPatient | null>(null)
  const [debouncedTerm] = useDebounce(searchTerm, 500)

  const { data, isLoading } = useSWR(
    open ? ['searchPatients', tenantSlug, debouncedTerm] : null,
    ([, slug, term]) => getPatientsAction(slug, 1, 15, term as string),
    { keepPreviousData: true },
  )

  const patients = data?.items || []

  React.useEffect(() => {
    if (!selectedPatientId) {
      setSelectedPatient(null)
      setSearchTerm('')
    }
  }, [selectedPatientId])

  const handleNewPatientSuccess = (newId: string, newName: string) => {
    const newPatient = { id: newId, name: newName, phone: searchTerm } as IPatient
    setSelectedPatient(newPatient)
    onSelect(newPatient)
    setIsAddModalOpen(false)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            type='button'
            role='combobox'
            className='w-full justify-between h-11 text-right font-normal bg-background min-w-0 overflow-hidden px-3'
          >
            {selectedPatient ? (
              <span className='flex items-center gap-2 flex-1 min-w-0'>
                <span className='font-bold truncate text-sm'>{selectedPatient.name}</span>
                <span className='text-[10px] text-muted-foreground shrink-0'>
                  ({selectedPatient.phone})
                </span>
              </span>
            ) : (
              <span className='text-muted-foreground truncate text-sm'>ابحث عن مريض...</span>
            )}
            <ChevronsUpDown className='mr-auto h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className='p-0 shadow-xl border-border/60 w-[--radix-popover-trigger-width] max-w-87.5 md:max-w-none overflow-hidden '
          align='start'
        >
          <Command shouldFilter={false} className='w-full'>
            <CommandInput
              placeholder='بحث بالاسم أو الموبايل...'
              className='h-11'
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList
              className='max-h-64 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-primary/20'
              onWheel={(e) => e.stopPropagation()}
            >
              {isLoading && (
                <div className='flex items-center justify-center p-6 text-muted-foreground'>
                  <Loader2 className='h-4 w-4 animate-spin ml-2' />
                  <span className='text-xs'>جاري البحث...</span>
                </div>
              )}

              {!isLoading && patients.length === 0 && (
                <CommandEmpty className='p-4 text-center'>
                  <p className='text-xs text-muted-foreground mb-3'>لم يتم العثور على نتائج</p>
                  <Button
                    size='sm'
                    type='button'
                    variant='secondary'
                    className='h-8 text-xs'
                    onClick={() => {
                      setOpen(false)
                      setIsAddModalOpen(true)
                    }}
                  >
                    <UserPlus className='ml-1 h-3.5 w-3.5' />
                    إضافة مريض جديد
                  </Button>
                </CommandEmpty>
              )}

              <CommandGroup>
                {!isLoading &&
                  patients.map((patient) => (
                    <CommandItem
                      key={patient.id}
                      value={patient.id}
                      onSelect={() => {
                        setSelectedPatient(patient)
                        onSelect(patient)
                        setOpen(false)
                      }}
                      className='flex items-center justify-between cursor-pointer py-2.5 min-w-0 gap-2'
                    >
                      <div className='flex flex-col flex-1 min-w-0'>
                        <span className='font-bold text-sm truncate text-right'>
                          {patient.name}
                        </span>
                        <span
                          className='text-[10px] text-muted-foreground text-right mt-0.5'
                          dir='ltr'
                        >
                          {patient.phone}
                        </span>
                      </div>
                      <Check
                        className={cn(
                          'h-4 w-4 text-primary shrink-0',
                          selectedPatientId === patient.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AddPatientModal
        tenantSlug={tenantSlug}
        initialPhone={searchTerm.replace(/\D/g, '')}
        onSuccess={handleNewPatientSuccess}
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </>
  )
}

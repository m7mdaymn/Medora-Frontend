'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Copy, Eye, MoreHorizontalIcon, User } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { PermissionGate } from '../../../../../components/auth/permission-gate'
import { ROLES } from '../../../../../config/roles'
import { calculateAge } from '../../../../../lib/patient-utils'
import { IPatient } from '../../../../../types/patient'
import AddSubProfileModal from './AddSubProfileModal'
import { DeletePatientDialog } from './delete-patient-dialog'
import { EditPatientModal } from './edit-patient-modal'

interface PatientsListProps {
  data: IPatient[]
}

export function PatientsList({ data }: PatientsListProps) {
  const { tenantSlug } = useParams()

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader className='h-12 bg-muted/50'>
          <TableRow>
            <TableHead className='font-bold'>المريض</TableHead>
            <TableHead className='font-bold'>رقم الهاتف</TableHead>
            <TableHead className='font-bold'>السن</TableHead>
            <TableHead className='text-right font-bold'>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className='font-medium'>
                  <div className='flex items-center gap-3'>
                    <span className='font-semibold'>{patient.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>{patient.phone}</div>
                </TableCell>
                <TableCell>
                  {patient.dateOfBirth ? (
                    <div className='flex items-center gap-1.5'>
                      <span>{calculateAge(patient.dateOfBirth)} سنة</span>
                    </div>
                  ) : (
                    <span>-</span>
                  )}
                </TableCell>
                <TableCell className='text-right'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='h-8 w-8'>
                        <MoreHorizontalIcon className='h-4 w-4' />
                        <span className='sr-only'>Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuLabel className='text-xs'>خيارات المريض</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {/* زر عرض البروفايل - متاح للجميع */}
                      <Link href={`/${tenantSlug}/dashboard/patients/${patient.id}`}>
                        <DropdownMenuItem>
                          <Eye className='h-4 w-4' />
                          عرض البروفايل
                        </DropdownMenuItem>
                      </Link>

                      <AddSubProfileModal
                        parentId={patient.id}
                        parentName={patient.name}
                        tenantSlug={tenantSlug as string}
                      />

                      <PermissionGate
                        allowedRoles={[ROLES.CLINIC_OWNER, ROLES.CLINIC_MANAGER, ROLES.SUPER_ADMIN]}
                      >
                        <EditPatientModal patient={patient} />
                      </PermissionGate>

                      <DropdownMenuItem
                        onClick={() => navigator.clipboard.writeText(patient.phone)}
                      >
                        <Copy className='w-4 h-4' />
                        نسخ الرقم
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <PermissionGate allowedRoles={[ROLES.CLINIC_OWNER, ROLES.SUPER_ADMIN]}>
                        <DeletePatientDialog patientId={patient.id} patientName={patient.name} />
                      </PermissionGate>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className='h-32 text-center text-muted-foreground'>
                <div className='flex flex-col items-center justify-center gap-2'>
                  <User className='h-8 w-8 opacity-50' />
                  <p>لا يوجد مرضى مسجلين حتى الآن</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

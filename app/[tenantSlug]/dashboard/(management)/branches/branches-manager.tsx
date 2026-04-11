'use client'

import {
  createBranchWithSetupAction,
  getBranchesAction,
  setBranchStatusAction,
  updateBranchAction,
} from '@/actions/branch/branches'
import { getDoctorsAction } from '@/actions/doctor/get-doctors'
import { getClinicPaymentOptionsAction } from '@/actions/settings/get-settings'
import { getAllStaffAction } from '@/actions/staff/get-staff'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/store/useAuthStore'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { IBranch } from '@/types/branch'
import { IDoctor } from '@/types/doctor'
import { IClinicPaymentMethod } from '@/types/settings'
import { IStaff } from '@/types/staff'
import { UpsertBranchInput, upsertBranchSchema } from '@/validation/branch'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { Loader2, Pencil, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

interface BranchesManagerProps {
  tenantSlug: string
  initialBranches: IBranch[]
}

const GLOBAL_PAYMENT_TEMPLATE = '__global__'
const NO_STAFF_TEMPLATE = '__none__'

const defaultBranchValues: UpsertBranchInput = {
  name: '',
  code: '',
  address: '',
  phone: '',
  isActive: true,
}

function findDefaultTemplateSource(branches: IBranch[]): string {
  const byCode = branches.find(
    (branch) => branch.isActive && (branch.code || '').trim().toLowerCase() === 'main',
  )
  if (byCode) {
    return byCode.id
  }

  const byName = branches.find(
    (branch) =>
      branch.isActive && /(^|\s)(main|الرئيس|الرئيسي)(\s|$)/i.test((branch.name || '').trim()),
  )

  if (byName) {
    return byName.id
  }

  return GLOBAL_PAYMENT_TEMPLATE
}

export function BranchesManager({ tenantSlug, initialBranches }: BranchesManagerProps) {
  const currentRole = useAuthStore((state) => state.user?.role)
  const canMutateBranches = currentRole === 'ClinicOwner' || currentRole === 'SuperAdmin'

  const [branches, setBranches] = useState<IBranch[]>(initialBranches)
  const [showInactive, setShowInactive] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<IBranch | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processingBranchId, setProcessingBranchId] = useState<string | null>(null)

  const [isLoadingSetupData, setIsLoadingSetupData] = useState(false)
  const [staffMembers, setStaffMembers] = useState<IStaff[]>([])
  const [doctors, setDoctors] = useState<IDoctor[]>([])
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([])
  const [staffSearch, setStaffSearch] = useState('')
  const [doctorSearch, setDoctorSearch] = useState('')

  const [copyPaymentTemplate, setCopyPaymentTemplate] = useState(true)
  const [paymentSourceBranchId, setPaymentSourceBranchId] = useState(GLOBAL_PAYMENT_TEMPLATE)
  const [paymentTemplateMethods, setPaymentTemplateMethods] = useState<IClinicPaymentMethod[]>([])
  const [isLoadingPaymentTemplate, setIsLoadingPaymentTemplate] = useState(false)
  const [staffTemplateBranchId, setStaffTemplateBranchId] = useState(NO_STAFF_TEMPLATE)

  const form = useForm<UpsertBranchInput>({
    resolver: valibotResolver(upsertBranchSchema),
    defaultValues: defaultBranchValues,
  })

  const sanitizeOptional = (value: string | undefined) => {
    const normalized = value?.trim()
    return normalized ? normalized : undefined
  }

  const filteredStaff = useMemo(() => {
    const query = staffSearch.trim().toLowerCase()
    if (!query) {
      return staffMembers
    }

    return staffMembers.filter((staff) => {
      const role = (staff.role || '').toLowerCase()
      const name = (staff.name || '').toLowerCase()
      const username = (staff.username || '').toLowerCase()
      return name.includes(query) || username.includes(query) || role.includes(query)
    })
  }, [staffMembers, staffSearch])

  const filteredDoctors = useMemo(() => {
    const query = doctorSearch.trim().toLowerCase()
    if (!query) {
      return doctors
    }

    return doctors.filter((doctor) => {
      const name = (doctor.name || '').toLowerCase()
      const specialty = (doctor.specialty || '').toLowerCase()
      const username = (doctor.username || '').toLowerCase()
      return name.includes(query) || specialty.includes(query) || username.includes(query)
    })
  }, [doctors, doctorSearch])

  const activeTemplateBranches = useMemo(() => {
    return branches.filter((branch) => branch.isActive)
  }, [branches])

  const mainTemplateBranchId = useMemo(() => {
    const source = findDefaultTemplateSource(branches)
    return source === GLOBAL_PAYMENT_TEMPLATE ? null : source
  }, [branches])

  async function refreshBranches(includeInactive = showInactive) {
    setIsRefreshing(true)
    const result = await getBranchesAction(tenantSlug, includeInactive)

    if (result.success && result.data) {
      setBranches(result.data)
    } else {
      toast.error(result.message || 'تعذر تحديث قائمة الفروع')
    }

    setIsRefreshing(false)
  }

  async function loadPaymentTemplate(sourceValue: string) {
    setIsLoadingPaymentTemplate(true)
    const sourceBranchId = sourceValue === GLOBAL_PAYMENT_TEMPLATE ? undefined : sourceValue
    const result = await getClinicPaymentOptionsAction(tenantSlug, sourceBranchId)

    if (!result.success || !result.data) {
      setPaymentTemplateMethods([])
      setIsLoadingPaymentTemplate(false)
      toast.error(result.message || 'تعذر تحميل قالب الدفع')
      return
    }

    const scopedMethods = result.data.methods.filter((method) =>
      sourceBranchId ? method.branchId === sourceBranchId : method.branchId === null,
    )

    setPaymentTemplateMethods(scopedMethods)
    setIsLoadingPaymentTemplate(false)
  }

  async function loadCreateSetupData(defaultTemplateSource: string, defaultStaffTemplateSource: string) {
    setIsLoadingSetupData(true)

    const [staffResult, doctorsResult] = await Promise.all([
      getAllStaffAction(tenantSlug),
      getDoctorsAction(tenantSlug),
    ])

    setStaffMembers(staffResult)
    setDoctors(doctorsResult.doctors)

    if (defaultStaffTemplateSource === NO_STAFF_TEMPLATE) {
      setSelectedStaffIds([])
    } else {
      const defaultStaffIds = staffResult
        .filter((staff) => (staff.assignedBranchIds || []).includes(defaultStaffTemplateSource))
        .map((staff) => staff.id)
      setSelectedStaffIds(defaultStaffIds)
    }

    setIsLoadingSetupData(false)

    await loadPaymentTemplate(defaultTemplateSource)
  }

  function openCreateDialog() {
    if (!canMutateBranches) {
      toast.error('إدارة الفروع متاحة لمالك العيادة فقط')
      return
    }

    const templateSource = findDefaultTemplateSource(branches)
    const defaultStaffTemplateSource =
      templateSource === GLOBAL_PAYMENT_TEMPLATE ? NO_STAFF_TEMPLATE : templateSource

    setEditingBranch(null)
    form.reset(defaultBranchValues)
    setSelectedStaffIds([])
    setSelectedDoctorIds([])
    setStaffSearch('')
    setDoctorSearch('')
    setCopyPaymentTemplate(true)
    setPaymentSourceBranchId(templateSource)
    setPaymentTemplateMethods([])
    setStaffTemplateBranchId(defaultStaffTemplateSource)
    setIsDialogOpen(true)

    void loadCreateSetupData(templateSource, defaultStaffTemplateSource)
  }

  function openEditDialog(branch: IBranch) {
    if (!canMutateBranches) {
      toast.error('إدارة الفروع متاحة لمالك العيادة فقط')
      return
    }

    setEditingBranch(branch)
    form.reset({
      name: branch.name,
      code: branch.code || '',
      address: branch.address || '',
      phone: branch.phone || '',
      isActive: branch.isActive,
    })
    setIsDialogOpen(true)
  }

  function toggleStaffSelection(staffId: string) {
    setSelectedStaffIds((current) =>
      current.includes(staffId)
        ? current.filter((item) => item !== staffId)
        : [...current, staffId],
    )
  }

  function toggleDoctorSelection(doctorId: string) {
    setSelectedDoctorIds((current) =>
      current.includes(doctorId)
        ? current.filter((item) => item !== doctorId)
        : [...current, doctorId],
    )
  }

  function applyStaffTemplate(sourceBranchId: string) {
    if (sourceBranchId === NO_STAFF_TEMPLATE) {
      setSelectedStaffIds([])
      return
    }

    const nextStaffIds = staffMembers
      .filter((staff) => (staff.assignedBranchIds || []).includes(sourceBranchId))
      .map((staff) => staff.id)

    setSelectedStaffIds(nextStaffIds)
  }

  function applyMainBranchPreset() {
    if (!mainTemplateBranchId) {
      return
    }

    setCopyPaymentTemplate(true)
    setPaymentSourceBranchId(mainTemplateBranchId)
    setStaffTemplateBranchId(mainTemplateBranchId)
    applyStaffTemplate(mainTemplateBranchId)
    void loadPaymentTemplate(mainTemplateBranchId)
  }

  async function onSubmit(values: UpsertBranchInput) {
    if (!canMutateBranches) {
      toast.error('إدارة الفروع متاحة لمالك العيادة فقط')
      return
    }

    setIsSubmitting(true)

    const payload = {
      name: values.name.trim(),
      code: sanitizeOptional(values.code),
      address: sanitizeOptional(values.address),
      phone: sanitizeOptional(values.phone),
      ...(editingBranch ? { isActive: values.isActive } : {}),
    }

    if (editingBranch) {
      const updateResult = await updateBranchAction(tenantSlug, editingBranch.id, payload)

      if (updateResult.success) {
        toast.success(updateResult.message || 'تم تحديث الفرع بنجاح')
        setIsDialogOpen(false)
        await refreshBranches(showInactive)
      } else {
        toast.error(updateResult.message || 'فشل حفظ بيانات الفرع')
      }

      setIsSubmitting(false)
      return
    }

    const createResult = await createBranchWithSetupAction(tenantSlug, {
      ...payload,
      paymentSourceBranchId: copyPaymentTemplate
        ? paymentSourceBranchId === GLOBAL_PAYMENT_TEMPLATE
          ? null
          : paymentSourceBranchId
        : undefined,
      assignStaffIds: selectedStaffIds,
      assignDoctorIds: selectedDoctorIds,
    })

    if (createResult.success) {
      if (createResult.data) {
        const setupSummary = `طرق الدفع: ${createResult.data.paymentMethodsCopied} | العاملون: ${createResult.data.staffAssigned} | الأطباء: ${createResult.data.doctorAssignmentsRequested}`
        toast.success(`${createResult.message || 'تم إنشاء الفرع بنجاح'} (${setupSummary})`)

        if (createResult.data.warnings.length > 0) {
          createResult.data.warnings.slice(0, 2).forEach((warning: string) => {
            toast.warning(warning)
          })

          if (createResult.data.warnings.length > 2) {
            toast.warning(
              `هناك ${createResult.data.warnings.length - 2} ملاحظات إضافية في عملية التهيئة.`,
            )
          }
        }
      } else {
        toast.success(createResult.message || 'تم إنشاء الفرع بنجاح')
      }

      setIsDialogOpen(false)
      await refreshBranches(showInactive)
    } else {
      toast.error(createResult.message || 'فشل حفظ بيانات الفرع')
    }

    setIsSubmitting(false)
  }

  async function onToggleStatus(branch: IBranch) {
    if (!canMutateBranches) {
      toast.error('إدارة الفروع متاحة لمالك العيادة فقط')
      return
    }

    const nextStatus = !branch.isActive

    if (!nextStatus) {
      const confirmed = window.confirm('هل تريد إيقاف هذا الفرع؟')
      if (!confirmed) {
        return
      }
    }

    setProcessingBranchId(branch.id)
    const result = await setBranchStatusAction(tenantSlug, branch.id, nextStatus)

    if (result.success) {
      toast.success(result.message || (nextStatus ? 'تم تفعيل الفرع' : 'تم إيقاف الفرع'))
      await refreshBranches(showInactive)
    } else {
      toast.error(result.message || 'تعذر تغيير حالة الفرع')
    }

    setProcessingBranchId(null)
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-3 rounded-md border px-3 py-2'>
          <Switch
            checked={showInactive}
            onCheckedChange={(checked) => {
              setShowInactive(checked)
              void refreshBranches(checked)
            }}
            dir='ltr'
          />
          <span className='text-sm'>عرض الفروع غير النشطة</span>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => void refreshBranches(showInactive)}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader2 className='h-4 w-4 animate-spin' /> : <RefreshCw className='h-4 w-4' />}
            تحديث
          </Button>
          {canMutateBranches ? (
            <Button type='button' onClick={openCreateDialog}>
              <Plus className='h-4 w-4' />
              إضافة فرع
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الفرع</TableHead>
                <TableHead>الكود</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>عدد الموظفين</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className='text-end'>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='h-24 text-center text-muted-foreground'>
                    لا توجد فروع لعرضها حالياً.
                  </TableCell>
                </TableRow>
              ) : (
                branches.map((branch) => (
                  <TableRow key={branch.id} className={branch.isActive ? '' : 'opacity-60'}>
                    <TableCell className='font-medium'>{branch.name}</TableCell>
                    <TableCell>{branch.code || '—'}</TableCell>
                    <TableCell>{branch.phone || '—'}</TableCell>
                    <TableCell className='max-w-60 truncate'>{branch.address || '—'}</TableCell>
                    <TableCell>{branch.assignedStaffCount}</TableCell>
                    <TableCell>
                      <Badge variant={branch.isActive ? 'default' : 'outline'}>
                        {branch.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center justify-end gap-2'>
                        {canMutateBranches ? (
                          <>
                            <Button type='button' variant='outline' size='sm' onClick={() => openEditDialog(branch)}>
                              <Pencil className='h-3.5 w-3.5' />
                              تعديل
                            </Button>
                            <Button
                              type='button'
                              variant={branch.isActive ? 'destructive' : 'default'}
                              size='sm'
                              disabled={processingBranchId === branch.id}
                              onClick={() => void onToggleStatus(branch)}
                            >
                              {processingBranchId === branch.id ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                              ) : branch.isActive ? (
                                'إيقاف'
                              ) : (
                                'تفعيل'
                              )}
                            </Button>
                          </>
                        ) : (
                          <Badge variant='outline'>قراءة فقط</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='sm:max-w-4xl'>
          <DialogHeader>
            <DialogTitle>{editingBranch ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد'}</DialogTitle>
            <DialogDescription>
              {editingBranch
                ? 'يمكنك تعديل البيانات الأساسية للفرع وحالة التفعيل.'
                : 'أدخل بيانات الفرع الجديد ثم حدد إعدادات الدفع والفريق العامل في نفس الخطوة.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الفرع</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='مثال: فرع مدينة نصر' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='code'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كود الفرع</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder='مثال: NSR' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الهاتف</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder='01xxxxxxxxx' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {editingBranch ? (
                  <FormField
                    control={form.control}
                    name='isActive'
                    render={({ field }) => (
                      <FormItem className='flex items-center justify-between rounded-lg border p-3'>
                        <FormLabel>حالة الفرع</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} dir='ltr' />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className='rounded-lg border p-3 text-sm text-muted-foreground flex items-center'>
                    سيتم إنشاء الفرع كفرع نشط افتراضياً
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name='address'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder='العنوان التفصيلي للفرع' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!editingBranch ? (
                <div className='space-y-4 rounded-xl border bg-muted/20 p-4'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div className='space-y-1'>
                      <h4 className='text-sm font-semibold'>التهيئة التفصيلية للفرع الجديد</h4>
                      <p className='text-xs text-muted-foreground'>
                        يتم تنفيذ الإعدادات مباشرة بعد إنشاء الفرع: نسخ إعدادات الدفع وربط الفريق العامل.
                      </p>
                    </div>

                    {mainTemplateBranchId ? (
                      <Button type='button' variant='outline' size='sm' onClick={applyMainBranchPreset}>
                        <Sparkles className='h-4 w-4' />
                        نسخ إعدادات الفرع الرئيسي
                      </Button>
                    ) : null}
                  </div>

                  <div className='space-y-3 rounded-lg border bg-background p-3'>
                    <div className='flex items-center justify-between gap-3'>
                      <div>
                        <p className='text-sm font-medium'>نسخ إعدادات الدفع</p>
                        <p className='text-xs text-muted-foreground'>
                          اختر الفرع/القالب الذي سيتم نسخ طرق الدفع منه إلى الفرع الجديد.
                        </p>
                      </div>
                      <Switch
                        checked={copyPaymentTemplate}
                        onCheckedChange={setCopyPaymentTemplate}
                        dir='ltr'
                      />
                    </div>

                    {copyPaymentTemplate ? (
                      <>
                        <div className='grid gap-3 md:grid-cols-2'>
                          <div className='space-y-1'>
                            <p className='text-xs text-muted-foreground'>مصدر قالب الدفع</p>
                            <Select
                              value={paymentSourceBranchId}
                              onValueChange={(value) => {
                                setPaymentSourceBranchId(value)
                                void loadPaymentTemplate(value)
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder='اختر المصدر' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={GLOBAL_PAYMENT_TEMPLATE}>الإعدادات العامة (Main)</SelectItem>
                                {activeTemplateBranches.map((branch) => (
                                  <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className='rounded-md border px-3 py-2 text-xs text-muted-foreground'>
                            {isLoadingPaymentTemplate
                              ? 'جارٍ تحميل قالب الدفع...'
                              : `سيتم نسخ ${paymentTemplateMethods.length} طريقة دفع إلى الفرع الجديد.`}
                          </div>
                        </div>

                        <ScrollArea className='h-32 rounded-md border'>
                          <div className='space-y-1 p-2'>
                            {paymentTemplateMethods.length === 0 ? (
                              <p className='text-xs text-muted-foreground'>
                                لا توجد طرق دفع في القالب الحالي.
                              </p>
                            ) : (
                              paymentTemplateMethods.map((method) => (
                                <div
                                  key={method.id}
                                  className='flex items-center justify-between rounded-md border px-2 py-1.5 text-xs'
                                >
                                  <span className='font-medium'>{method.methodName}</span>
                                  <span className='text-muted-foreground'>
                                    {method.providerName || method.accountName || 'بدون مزود'}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </>
                    ) : (
                      <p className='text-xs text-muted-foreground'>
                        لن يتم نسخ إعدادات الدفع، وسيعتمد الفرع على الطرق العامة الحالية.
                      </p>
                    )}
                  </div>

                  <Separator />

                  {isLoadingSetupData ? (
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      جارٍ تحميل بيانات الأطباء والعاملين...
                    </div>
                  ) : (
                    <div className='grid gap-4 md:grid-cols-2'>
                      <div className='space-y-2 rounded-lg border bg-background p-3'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <p className='text-sm font-medium'>تعيين العاملين للفرع</p>
                            <p className='text-xs text-muted-foreground'>
                              يتم ربط العاملين المختارين بالفرع بعد الإنشاء.
                            </p>
                          </div>
                          <Badge variant='secondary'>{selectedStaffIds.length}</Badge>
                        </div>

                        <div className='flex gap-2'>
                          <Input
                            value={staffSearch}
                            onChange={(event) => setStaffSearch(event.target.value)}
                            placeholder='بحث بالاسم/الوظيفة'
                          />
                          <Button
                            type='button'
                            variant='outline'
                            onClick={() => setSelectedStaffIds(filteredStaff.map((staff) => staff.id))}
                          >
                            الكل
                          </Button>
                        </div>

                        <div className='grid gap-2 sm:grid-cols-3'>
                          <Select
                            value={staffTemplateBranchId}
                            onValueChange={setStaffTemplateBranchId}
                          >
                            <SelectTrigger className='sm:col-span-2'>
                              <SelectValue placeholder='اختر فرعاً لنسخ فريق العمل' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NO_STAFF_TEMPLATE}>بدون قالب</SelectItem>
                              {activeTemplateBranches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id}>
                                  {branch.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className='flex items-center gap-2'>
                            <Button
                              type='button'
                              variant='outline'
                              className='flex-1'
                              onClick={() => applyStaffTemplate(staffTemplateBranchId)}
                              disabled={staffTemplateBranchId === NO_STAFF_TEMPLATE}
                            >
                              تحميل
                            </Button>
                            <Button
                              type='button'
                              variant='ghost'
                              className='flex-1'
                              onClick={() => {
                                setStaffTemplateBranchId(NO_STAFF_TEMPLATE)
                                setSelectedStaffIds([])
                              }}
                            >
                              تفريغ
                            </Button>
                          </div>
                        </div>

                        <ScrollArea className='h-44 rounded-md border'>
                          <div className='space-y-1 p-2'>
                            {filteredStaff.length === 0 ? (
                              <p className='text-xs text-muted-foreground'>لا يوجد عاملون مطابقون للبحث.</p>
                            ) : (
                              filteredStaff.map((staff) => (
                                <label
                                  key={staff.id}
                                  className='flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60'
                                >
                                  <Checkbox
                                    checked={selectedStaffIds.includes(staff.id)}
                                    onCheckedChange={() => toggleStaffSelection(staff.id)}
                                  />
                                  <span className='space-y-0.5 text-xs'>
                                    <span className='block font-medium text-sm'>{staff.name}</span>
                                    <span className='block text-muted-foreground'>
                                      {staff.role} • {staff.workerMode}
                                    </span>
                                  </span>
                                </label>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </div>

                      <div className='space-y-2 rounded-lg border bg-background p-3'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <p className='text-sm font-medium'>تحديد أطباء الفرع</p>
                            <p className='text-xs text-muted-foreground'>
                              يتم تطبيق الخطوة بحسب دعم الربط المتاح في الخادم، مع تنبيهك بالملاحظات بعد الحفظ.
                            </p>
                          </div>
                          <Badge variant='secondary'>{selectedDoctorIds.length}</Badge>
                        </div>

                        <div className='flex gap-2'>
                          <Input
                            value={doctorSearch}
                            onChange={(event) => setDoctorSearch(event.target.value)}
                            placeholder='بحث بالاسم/التخصص'
                          />
                          <Button
                            type='button'
                            variant='outline'
                            onClick={() => setSelectedDoctorIds(filteredDoctors.map((doctor) => doctor.id))}
                          >
                            الكل
                          </Button>
                        </div>

                        <ScrollArea className='h-44 rounded-md border'>
                          <div className='space-y-1 p-2'>
                            {filteredDoctors.length === 0 ? (
                              <p className='text-xs text-muted-foreground'>لا يوجد أطباء مطابقون للبحث.</p>
                            ) : (
                              filteredDoctors.map((doctor) => (
                                <label
                                  key={doctor.id}
                                  className='flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60'
                                >
                                  <Checkbox
                                    checked={selectedDoctorIds.includes(doctor.id)}
                                    onCheckedChange={() => toggleDoctorSelection(doctor.id)}
                                  />
                                  <span className='space-y-0.5 text-xs'>
                                    <span className='block font-medium text-sm'>{doctor.name}</span>
                                    <span className='block text-muted-foreground'>
                                      {doctor.specialty || 'بدون تخصص'}
                                    </span>
                                  </span>
                                </label>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              <div className='flex items-center justify-end gap-2 pt-2'>
                <Button type='button' variant='outline' onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
                  {editingBranch ? 'حفظ التعديلات' : 'إنشاء الفرع وتجهيزه'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

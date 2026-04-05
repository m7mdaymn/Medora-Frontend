'use client'

import {
  addPatientMedicalThreadReplyAction,
  closePatientMedicalThreadAction,
  createPatientMedicalDocumentThreadAction,
  listPatientMedicalDocumentsAction,
  listPatientMedicalDocumentThreadsAction,
  uploadPatientMedicalDocumentAction,
} from '@/actions/patient-medical/documents'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DocumentCategory,
  IPatientMedicalDocument,
  IPatientMedicalDocumentThread,
} from '@/types/patient-medical'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

const DOCUMENT_CATEGORIES: DocumentCategory[] = ['Lab', 'Radiology', 'OtherMedicalDocument']

export default function PatientMedicalDocumentsPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string
  const patientId = params.id as string

  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState<DocumentCategory>('Lab')
  const [notes, setNotes] = useState('')
  const [workingDocumentId, setWorkingDocumentId] = useState<string | null>(null)

  const {
    data: documentsRes,
    isLoading,
    mutate,
  } = useSWR(['patient-medical-documents', tenantSlug, patientId], () =>
    listPatientMedicalDocumentsAction(tenantSlug, patientId),
  )

  const documents = documentsRes?.data || []

  const [threadsByDocument, setThreadsByDocument] = useState<
    Record<string, IPatientMedicalDocumentThread[]>
  >({})

  const uploadDocument = async (event: FormEvent) => {
    event.preventDefault()

    if (!file) {
      toast.error('اختر ملفاً أولاً')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)
    if (notes.trim()) {
      formData.append('notes', notes.trim())
    }

    const response = await uploadPatientMedicalDocumentAction(tenantSlug, patientId, formData)
    if (!response.success) {
      toast.error(response.message || 'فشل رفع الملف')
      return
    }

    toast.success('تم رفع الملف الطبي')
    setFile(null)
    setNotes('')
    await mutate()
  }

  const loadThreads = async (document: IPatientMedicalDocument) => {
    setWorkingDocumentId(document.id)
    try {
      const response = await listPatientMedicalDocumentThreadsAction(tenantSlug, patientId, document.id)
      if (!response.success || !response.data) {
        toast.error(response.message || 'فشل تحميل المناقشات')
        return
      }

      setThreadsByDocument((current) => ({
        ...current,
        [document.id]: response.data || [],
      }))
    } finally {
      setWorkingDocumentId(null)
    }
  }

  const createThread = async (document: IPatientMedicalDocument) => {
    const subject = window.prompt('عنوان المناقشة:')
    if (!subject || !subject.trim()) return

    const initialMessage = window.prompt('رسالة افتتاحية (اختياري):') || ''

    const response = await createPatientMedicalDocumentThreadAction(tenantSlug, patientId, document.id, {
      subject: subject.trim(),
      initialMessage: initialMessage.trim() || undefined,
    })

    if (!response.success) {
      toast.error(response.message || 'فشل إنشاء المناقشة')
      return
    }

    toast.success('تم إنشاء المناقشة')
    await loadThreads(document)
  }

  const addReply = async (document: IPatientMedicalDocument, threadId: string) => {
    const message = window.prompt('نص الرد:')
    if (!message || !message.trim()) return

    const response = await addPatientMedicalThreadReplyAction(
      tenantSlug,
      patientId,
      document.id,
      threadId,
      {
        message: message.trim(),
      },
    )

    if (!response.success) {
      toast.error(response.message || 'فشل إضافة الرد')
      return
    }

    toast.success('تمت إضافة الرد')
    await loadThreads(document)
  }

  const closeThread = async (document: IPatientMedicalDocument, threadId: string) => {
    const notesInput = window.prompt('ملاحظات الإغلاق (اختياري):') || ''

    const response = await closePatientMedicalThreadAction(
      tenantSlug,
      patientId,
      document.id,
      threadId,
      notesInput,
    )

    if (!response.success) {
      toast.error(response.message || 'فشل إغلاق المناقشة')
      return
    }

    toast.success('تم إغلاق المناقشة')
    await loadThreads(document)
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading='الوثائق الطبية'
        text='رفع ملفات المريض الطبية ومناقشتها بين الفريق الطبي والمريض'
      >
        <Button asChild variant='outline'>
          <Link href={`/${tenantSlug}/dashboard/patients/${patientId}`}>العودة لملف المريض</Link>
        </Button>
      </DashboardHeader>

      <Card className='rounded-2xl border-border/50 p-4'>
        <form onSubmit={uploadDocument} className='grid grid-cols-1 md:grid-cols-4 gap-3'>
          <div className='md:col-span-2 space-y-2'>
            <Label>الملف</Label>
            <Input type='file' onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </div>

          <div className='space-y-2'>
            <Label>الفئة</Label>
            <select
              className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
              value={category}
              onChange={(event) => setCategory(event.target.value as DocumentCategory)}
            >
              {DOCUMENT_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className='space-y-2'>
            <Label>ملاحظات</Label>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>

          <div className='md:col-span-4'>
            <Button type='submit'>رفع ملف</Button>
          </div>
        </form>
      </Card>

      {isLoading ? (
        <div className='space-y-2'>
          <Skeleton className='h-24 w-full rounded-2xl' />
          <Skeleton className='h-24 w-full rounded-2xl' />
        </div>
      ) : documents.length === 0 ? (
        <Card className='rounded-2xl p-8 text-center text-muted-foreground'>
          لا توجد وثائق مرفوعة لهذا المريض.
        </Card>
      ) : (
        <div className='space-y-3'>
          {documents.map((document) => {
            const threads = threadsByDocument[document.id] || []

            return (
              <Card key={document.id} className='rounded-2xl border-border/50 p-4 space-y-3'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='text-sm font-bold'>{document.originalFileName}</p>
                    <p className='text-xs text-muted-foreground'>
                      {document.category} • {new Date(document.createdAt).toLocaleString('ar-EG')}
                    </p>
                  </div>
                  <Badge variant='outline'>{(document.fileSizeBytes / 1024).toFixed(1)} KB</Badge>
                </div>

                <div className='flex flex-wrap gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => void loadThreads(document)}
                    disabled={workingDocumentId === document.id}
                  >
                    تحميل المناقشات
                  </Button>
                  <Button size='sm' onClick={() => void createThread(document)}>
                    بدء مناقشة
                  </Button>
                </div>

                {threads.length > 0 && (
                  <div className='space-y-2 border-t border-border/40 pt-3'>
                    {threads.map((thread) => (
                      <div key={thread.id} className='rounded-xl border border-border/40 p-3 space-y-2'>
                        <div className='flex items-center justify-between gap-2'>
                          <p className='text-sm font-semibold'>{thread.subject}</p>
                          <Badge variant={thread.status === 'Open' ? 'default' : 'outline'}>
                            {thread.status === 'Open' ? 'مفتوح' : 'مغلق'}
                          </Badge>
                        </div>

                        {thread.replies.length > 0 && (
                          <div className='space-y-1'>
                            {thread.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className='text-xs rounded-lg bg-muted/30 border border-border/30 p-2'
                              >
                                {reply.message}
                              </div>
                            ))}
                          </div>
                        )}

                        {thread.status === 'Open' && (
                          <div className='flex flex-wrap gap-2'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => void addReply(document, thread.id)}
                            >
                              إضافة رد
                            </Button>
                            <Button
                              size='sm'
                              variant='destructive'
                              onClick={() => void closeThread(document, thread.id)}
                            >
                              إغلاق المناقشة
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}

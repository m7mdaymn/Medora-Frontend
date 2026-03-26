'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, Check, Loader2, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { getUnreadDoctorNotes, markDoctorNoteAsReadAction } from '../actions/notes/notes' // 👈 الأكشنز بتاعتك
import { IDoctorNote } from '../types/notes'

export function DoctorNotesBell({ tenantSlug }: { tenantSlug: string }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // 1. الـ Key لازم يكون null لو الـ slug مش موجود عشان SWR ميبعتش ريكوست غلط
  // 2. الفيتشر بتنادي الأكشن بتاعك مباشرة
  const { data: notes, mutate } = useSWR<IDoctorNote[]>(
    tenantSlug ? `doctor-notes-unread-${tenantSlug}` : null,
    async () => {
      const res = await getUnreadDoctorNotes(tenantSlug)
      return res.data || []
    },
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    },
  )

  const handleMarkAsRead = async (e: React.MouseEvent, noteId: string) => {
    e.preventDefault()
    e.stopPropagation()

    setLoadingId(noteId)
    const res = await markDoctorNoteAsReadAction(tenantSlug, noteId)
    setLoadingId(null)

    if (res.success) {
      // بنحدث الكاش فوراً عشان الرسالة تختفي من قدام الريسبشن
      mutate(
        notes?.filter((n) => n.id !== noteId),
        false,
      )
    } else {
      toast.error(res.message || 'حدث خطأ')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='relative hover:bg-muted'>
          <Bell className='h-5 w-5 text-muted-foreground' />
          {notes && notes.length > 0 && (
            <span className='absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white animate-in zoom-in'>
              {notes.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-80 p-2' >
        <DropdownMenuLabel className='font-bold flex items-center gap-2'>
          <MessageSquare className='w-4 h-4 text-primary' />
          طلبات الأطباء الحالية
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {!notes || notes.length === 0 ? (
          <div className='py-8 text-center text-sm text-muted-foreground'>
            لا توجد طلبات جديدة من الأطباء حالياً
          </div>
        ) : (
          <div className='max-h-80 overflow-y-auto space-y-1'>
            {notes.map((note) => (
              <div
                key={note.id}
                className='flex flex-col gap-2 p-3 rounded-md bg-muted/30 border border-transparent hover:border-primary/20 transition-all'
              >
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-black text-primary underline underline-offset-4'>
                    د. {note.doctorName}
                  </span>
                  <span className='text-[10px] text-muted-foreground font-mono'>
                    {new Date(note.createdAt).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className='text-sm text-foreground font-medium leading-relaxed bg-background/50 p-2 rounded border border-dashed'>
                  {note.message}
                </p>

                <div className='flex justify-end'>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold gap-1'
                    onClick={(e) => handleMarkAsRead(e, note.id)}
                    disabled={loadingId === note.id}
                  >
                    {loadingId === note.id ? (
                      <Loader2 className='h-3 w-3 animate-spin' />
                    ) : (
                      <Check className='h-3 w-3' />
                    )}
                    تم التنفيذ
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import { IBooking } from '@/types/booking'
import arLocale from '@fullcalendar/core/locales/ar'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react' // must go before plugins
import timeGridPlugin from '@fullcalendar/timegrid'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'

// 🎨 Ultra Modern CSS Injection
const modernStyle = `
  .fc {
    --fc-border-color: rgba(255, 255, 255, 0.05);
    --fc-today-bg-color: transparent;
    --fc-now-indicator-color: #ef4444;
  }

  /* إلغاء الهيدر الأصلي */
  .fc .fc-toolbar {
    display: none !important;
  }

  /* تنظيف الشبكة */
  .fc-theme-standard td, .fc-theme-standard th {
    border: 1px solid var(--fc-border-color) !important;
  }
  
  /* جعل الخطوط مستقيمة وليست منقطة */
  .fc-timegrid-slot {
  height: 30px !important; /* 👈 ده السطر اللي هينفخ المربعات */
    border-bottom: 1px solid var(--fc-border-color) !important;
    padding: 10px 0 !important;
  }

  /* الهيدر العلوي للأيام */
  .fc-col-header-cell {
    background: transparent;
    border: none !important;
    border-bottom: 1px solid var(--fc-border-color) !important;
    padding-bottom: 10px;
  }

  .fc-col-header-cell-cushion {
    font-size: 0.9rem;
    font-weight: 400;
    color: #94a3b8; /* Slate-400 */
    text-decoration: none !important;
  }

  /* تنسيق عمود الوقت الجانبي */
  .fc-timegrid-slot-label-cushion {
    font-size: 0.75rem;
    color: #64748b; /* Slate-500 */
    text-transform: uppercase;
    font-weight: 600;
  }
  
  /* إخفاء حدود السكرول */
  .fc-scrollgrid {
    border: none !important;
  }

  /* الموعد نفسه */
  .fc-event {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: transform 0.2s, opacity 0.2s;
  }
  .fc-event:hover {
    transform: scale(1.0001);
    z-index: 50;
  }
`

interface Props {
  bookingsList: IBooking[]
}

export function AppointmentsCalendar({ bookingsList }: Props) {
  const calendarRef = useRef<FullCalendar>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState('timeGridDay')
  const [title, setTitle] = useState('')

  const handleNext = () => {
    const calendarApi = calendarRef.current?.getApi()
    calendarApi?.next()
    setCurrentDate(calendarApi?.getDate() || new Date())
  }

  const handlePrev = () => {
    const calendarApi = calendarRef.current?.getApi()
    calendarApi?.prev()
    setCurrentDate(calendarApi?.getDate() || new Date())
  }

  const handleToday = () => {
    const calendarApi = calendarRef.current?.getApi()
    calendarApi?.today()
    setCurrentDate(calendarApi?.getDate() || new Date())
  }

  const changeView = (view: string) => {
    const calendarApi = calendarRef.current?.getApi()
    calendarApi?.changeView(view)
    setViewType(view)
  }

  // تحويل البيانات
  const events = bookingsList.map((booking) => ({
    id: booking.id,
    title: booking.patientName,
    start: `${booking.bookingDate.split('T')[0]}T${booking.bookingTime}`,
    end: new Date(
      new Date(`${booking.bookingDate.split('T')[0]}T${booking.bookingTime}`).getTime() +
        30 * 60000,
    ),
    extendedProps: { ...booking },
  }))

  return (
    <div className='flex flex-col h-full space-y-4'>
      <style>{modernStyle}</style>

      {/* 1. الـ Custom Toolbar بتاعنا (Shadcn Style) */}
      <div className='flex items-center justify-between px-1'>
        <div className='flex items-center gap-2'>
          <h2 className='text-xl font-bold text-foreground flex items-center gap-2 min-w-50'>
            <CalendarIcon className='w-5 h-5 text-primary' />
            {/* 2. اعرض العنوان اللي جاي من المكتبة مباشرة */}
            {title}
          </h2>
          <div className='flex items-center bg-secondary/50 rounded-md p-1 mr-4 border border-border/50'>
            <Button variant='ghost' size='icon' className='h-7 w-7' onClick={handleNext}>
              <ChevronRight className='h-4 w-4' />
            </Button>
            <Button variant='ghost' size='sm' className='h-7 text-xs px-2' onClick={handleToday}>
              اليوم
            </Button>
            <Button variant='ghost' size='icon' className='h-7 w-7' onClick={handlePrev}>
              <ChevronLeft className='h-4 w-4' />
            </Button>
          </div>
        </div>

        <div className='bg-secondary/50 p-1 rounded-md border border-border/50 flex gap-1'>
          <Button
            variant={viewType === 'dayGridMonth' ? 'secondary' : 'ghost'}
            size='sm'
            className='h-7 text-xs'
            onClick={() => changeView('dayGridMonth')}
          >
            شهر
          </Button>
          <Button
            variant={viewType === 'timeGridWeek' ? 'secondary' : 'ghost'}
            size='sm'
            className='h-7 text-xs'
            onClick={() => changeView('timeGridWeek')}
          >
            أسبوع
          </Button>
          <Button
            variant={viewType === 'timeGridDay' ? 'secondary' : 'ghost'}
            size='sm'
            className='h-7 text-xs'
            onClick={() => changeView('timeGridDay')}
          >
            يوم
          </Button>
        </div>
      </div>

      {/* 2. جسم الكاليندر */}
      <div className='flex-1 bg-card/50 rounded-xl border border-border/40 shadow-sm overflow-hidden backdrop-blur-sm'>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView='timeGridDay'
          headerToolbar={false}
          allDaySlot={false}
          slotMinTime='08:00:00'
          slotMaxTime='23:00:00'
          slotDuration='00:30:00'
          locale={arLocale}
          direction='rtl'
          height='700px'
          nowIndicator={true}
          events={events}
          editable={false}
          datesSet={(dateInfo) => {
            setTitle(dateInfo.view.title)
          }}
          // Custom Event Styling
          eventContent={(info) => {
            const status = info.event.extendedProps.status
            const colors =
              {
                Confirmed: 'bg-blue-500/10 border-l-blue-500 text-blue-500',
                Cancelled: 'bg-red-500/10 border-l-red-500 text-red-500',
                Completed: 'bg-emerald-500/10 border-l-emerald-500 text-emerald-500',
                Rescheduled: 'bg-amber-500/10 border-l-amber-500 text-amber-500',
              }[status as string] || 'bg-slate-500/10 border-l-slate-500 text-slate-500'

            return (
              <div
                className={`w-full h-full p-2 border-l-[3px] rounded-r-md flex flex-col justify-center gap-0.5 ${colors} hover:bg-opacity-20 transition-colors`}
              >
                <div className='font-bold text-[11px] leading-tight'>{info.event.title}</div>
                <div className='text-[10px] opacity-80 flex items-center gap-1'>
                  <span>{info.timeText}</span>
                </div>
              </div>
            )
          }}
          eventClassNames='!bg-transparent !border-0 !shadow-none' 
        />
      </div>
    </div>
  )
}

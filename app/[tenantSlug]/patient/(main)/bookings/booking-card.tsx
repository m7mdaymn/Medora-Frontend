// import { Calendar, Clock, Stethoscope, User } from 'lucide-react'
// import { Card, CardContent } from '../../../../../components/ui/card'
// import { IBooking } from '../../../../../types/booking'
// import { CancelBookingButton } from './CancelBookingButton'
// import { StatusBadge } from './status-badge'

// export function BookingCard({
//   booking,
//   isPast,
//   tenantSlug,
// }: {
//   booking: IBooking
//   isPast: boolean
//   tenantSlug: string
// }) {
//   return (
//     <Card
//       className={`rounded-2xl border-none shadow-sm overflow-hidden transition-opacity p-0 ${isPast ? 'opacity-80 grayscale-[0.3]' : ''}`}
//     >
//       <div
//         className={`h-1 w-full ${
//           booking.status === 'Confirmed'
//             ? 'bg-primary'
//             : booking.status === 'Completed'
//               ? 'bg-green-500'
//               : booking.status === 'Cancelled'
//                 ? 'bg-destructive'
//                 : 'bg-yellow-500'
//         }`}
//       />
//       <CardContent className='p-5 space-y-4'>
//         <div className='flex justify-between items-center'>
//           <div className='flex items-center gap-3'>
//             <div className='bg-muted rounded-full p-2'>
//               <User className='h-4 w-4 text-primary' />
//             </div>
//             <p className='font-bold text-[15px]'>{booking.doctorName}</p>
//           </div>
//           <StatusBadge status={booking.status} />
//         </div>

//         <div className='flex items-center gap-2 text-sm text-muted-foreground'>
//           <Stethoscope className='h-4 w-4' />
//           <span>{booking.serviceName || 'كشف عام'}</span>
//         </div>

//         <div className='flex items-center gap-3 bg-muted/30 p-3 rounded-xl'>
//           <div className='flex items-center gap-1.5 text-[13px] font-bold'>
//             <Calendar className='h-4 w-4 text-primary' />
//             <span dir='ltr'>{new Date(booking.bookingDate).toLocaleDateString('en-GB')}</span>
//           </div>
//           <div className='w-px h-3 bg-border' />
//           <div className='flex items-center gap-1.5 text-[13px] font-bold'>
//             <Clock className='h-4 w-4 text-primary' />
//             <span dir='ltr'>{booking.bookingTime}</span>
//           </div>
//         </div>
//         {!isPast && booking.status === 'Confirmed' && (
//           <div className='flex justify-end pt-2 border-t mt-2'>
//             <CancelBookingButton booking={booking} />
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   )
// }

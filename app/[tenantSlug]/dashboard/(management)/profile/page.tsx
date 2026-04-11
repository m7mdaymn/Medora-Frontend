import { getMeAction } from '../../../../../actions/Profiles/staff-profile'
import { ROLE_CONFIG } from '../../../../../config/roles'

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>
}) {
  const { tenantSlug } = await params

  const response = await getMeAction(tenantSlug)
  const user = response?.data

  if (!user) {
    return (
      <div className='py-20 text-center text-sm font-medium text-muted-foreground border border-border/40 rounded-xl bg-muted/5'>
        تعذر تحميل بيانات الملف الشخصي.
      </div>
    )
  }

  const initial = user.displayName?.charAt(0).toUpperCase() || 'U'

  return (
    <div className='max-w-3xl mx-auto pt-8 animate-in fade-in duration-500'>
      <div className='relative flex flex-col bg-card border border-border/50 rounded-3xl shadow-sm overflow-hidden'>
        <div className='h-32 sm:h-40 bg-linear-to-r from-muted/50 via-muted/30 to-background border-b border-border/40' />

        {/* Floating Avatar */}
        <div className='absolute top-16 sm:top-24 right-8 w-24 h-24 sm:w-32 sm:h-32 bg-background border-4 border-background rounded-full flex items-center justify-center shadow-sm'>
          <div className='w-full h-full rounded-full bg-primary/10 flex items-center justify-center'>
            <span className='text-4xl sm:text-6xl font-black text-primary'>{initial}</span>
          </div>
        </div>

        {/* Profile Content */}
        <div className='pt-12 sm:pt-20 px-8 pb-10'>
          <div className='flex flex-col gap-1'>
            <h1 className='text-3xl sm:text-4xl font-black text-foreground tracking-tight'>
              {user.displayName}
            </h1>
            <p className='text-lg font-bold text-muted-foreground'>{ROLE_CONFIG[user.role].label}</p>
          </div>

          <hr className='my-8 border-border/50' />

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12'>
            <div className='flex flex-col gap-2'>
              <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                اسم المستخدم للولوج (Username)
              </span>
              <span className='text-xl font-mono font-medium text-foreground'>{user.username}</span>
            </div>

            <div className='flex flex-col gap-2'>
              <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                حالة الحساب
              </span>
              <div>
                <span className='inline-flex items-center justify-center px-3 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-600 rounded-md'>
                  نشط ومصرح له بالدخول
                </span>
              </div>
            </div>

            <div className='flex flex-col gap-2'>
              <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                مستوى الوصول
              </span>
              <span className='text-base font-bold text-foreground'>تصريح كامل للنظام</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

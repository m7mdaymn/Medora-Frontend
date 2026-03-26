export function Footer() {
  return (
    // واخد نفس خلفية الـ CTA (bg-muted/20) عشان يبانوا كأنهم شاشة واحدة في الآخر
    // البوردر خفيف جدا (border-border/20) عشان ميفصلش العين
    <footer className='relative z-10 py-6 bg-muted/20 border-t border-border/20' dir='rtl'>
      <div className='container mx-auto px-4 md:px-6'>
        <div className='flex flex-col items-center justify-center gap-2 text-center text-sm font-medium text-muted-foreground md:flex-row'>
          <p>© {new Date().getFullYear()} ميدورا (Medora). جميع الحقوق محفوظة.</p>
          <span className='hidden md:inline text-border'>•</span>
        </div>
      </div>
    </footer>
  )
}

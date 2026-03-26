// app/(public)/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    // بنجبر الجزء ده من الموقع إنه يفضل Light دايماً
    <ThemeProvider forcedTheme='light' attribute='class'>
      <div className=' min-h-screen font-serif'>{children}</div>
    </ThemeProvider>
  )
}

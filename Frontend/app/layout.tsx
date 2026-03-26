// app/layout.tsx
import { ThemeProvider } from '@/components/theme-provider'
import { DirectionProvider } from '@/components/ui/direction'
import { Toaster } from '@/components/ui/sonner'
import type { Metadata, Viewport } from 'next'
import { Cairo, Tajawal } from 'next/font/google'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-alex',
  display: 'swap',
  weight: ['200', '300', '400', '700', '800', '900', '600'],
})

const tajawal = Tajawal({
  subsets: ['arabic'],
  variable: '--font-zain',
  display: 'swap',
  weight: ['200', '300', '400', '700', '800', '900'],
})

// فصلنا الـ Viewport لأن Next.js 14+ بيطلب فصلها عن الـ Metadata
export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  // title: {
  //   default: 'Medora | سيستم إدارة العيادات الذكي',
  //   template: '%s | Medora',
  // },
  title: 'Medora | سيستم إدارة العيادات الذكي',
  description:
    'نظام Medora السحابي لإدارة العيادات الطبية بكفاءة، يشمل حجوزات، تقارير مالية، وروشتات إلكترونية.',
  applicationName: 'Medora',
  // manifest: '/manifest.json', // هيقرا من الـ manifest.ts اللي عملناه
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    siteName: 'Medora',
    title: 'Medora | سيستم إدارة العيادات الذكي',
    description: 'النظام السحابي المتكامل لرقمنة عيادتك وإدارتها باحترافية.',
    // images: ['/og-image.jpg'], // جهز صورة عرض وحطها هنا بعدين
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Medora | سيستم إدارة العيادات الذكي',
    description: 'النظام السحابي المتكامل لرقمنة عيادتك وإدارتها باحترافية.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='ar' dir='rtl' suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${tajawal.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <DirectionProvider direction='rtl' dir={'rtl'}>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </DirectionProvider>
      </body>
    </html>
  )
}

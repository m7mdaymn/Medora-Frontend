'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ModeToggle } from '../ModeToggle'

export function Navbar() {
  const routes = [
    { href: '#features', label: 'المميزات' },
    { href: '#faq', label: 'الأسئلة الشائعة' },
    { href: '#contact', label: 'تواصل معنا' },
  ]

  return (
    // 1. شيلنا الـ wrapper الطاير. الهيدر نفسه بقى واخد العرض كله ولازق فوق
    <header className='sticky top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl transition-all duration-300'>
      {/* 2. المحتوى الداخلي هو اللي محكوم بـ container عشان يفضل متوازي مع باقي الصفحة */}
      <div className='container mx-auto flex h-16 items-center justify-between px-4 md:px-6'>
        {/* اليمين: اللوجو */}
        <Link href='/' >
          <div className='relative w-8 h-8 md:w-9 md:h-9 overflow-hidden'>
            <Image src='/logo.png' alt='ميدورا' fill className='object-contain' priority />
          </div>
        </Link>

        {/* المنتصف: الروابط (ديسكتوب) */}
        <nav className='hidden md:flex items-center gap-8'>
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className='text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
            >
              {route.label}
            </Link>
          ))}
        </nav>

        {/* اليسار: الثيم والموبايل */}
        <div className='flex items-center gap-3'>
          <div className='hidden md:block'>
            <ModeToggle />
          </div>

          {/* قائمة الموبايل (Top Sheet) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon' className='md:hidden h-9 w-9 rounded-full'>
                <Menu className='h-5 w-5' />
                <span className='sr-only'>فتح القائمة</span>
              </Button>
            </SheetTrigger>

            <SheetContent side='top' className='border-b-border/50 rounded-b-3xl pt-14 pb-8 px-6'>
              <SheetTitle className='sr-only'>قائمة ميدورا</SheetTitle>

              <div className='flex flex-col gap-8'>
                <Link href='/' className='flex items-center gap-3'>
                  <div className='relative w-8 h-8 overflow-hidden'>
                    <Image src='/logo.png' alt='ميدورا' fill className='object-contain' />
                  </div>
                  <span className='font-bold text-xl tracking-tight'>ميدورا</span>
                </Link>

                <nav className='flex flex-col gap-5'>
                  {routes.map((route) => (
                    <Link
                      key={route.href}
                      href={route.href}
                      className='text-base font-medium text-foreground hover:text-primary transition-colors'
                    >
                      {route.label}
                    </Link>
                  ))}
                </nav>

                <div className='flex items-center justify-between pt-6 border-t border-border/50'>
                  <span className='text-sm font-medium text-muted-foreground'>مظهر النظام</span>
                  <ModeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

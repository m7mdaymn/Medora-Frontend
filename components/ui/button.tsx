import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
        soft: 'bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30',
        glass:
          'bg-background/40 backdrop-blur-md border border-border/50 shadow-sm hover:bg-background/60 text-foreground',
        gradient:
          'bg-gradient-to-r from-primary to-blue-600 text-white shadow-md hover:opacity-90 hover:shadow-lg transition-all',
        elevated:
          'bg-background shadow-md hover:shadow-lg border border-border/50 text-foreground hover:-translate-y-0.5 transition-transform duration-200',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: "h-6 gap-1  px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8  gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10  px-6 has-[>svg]:px-4',

        xl: "h-12  px-8 text-base has-[>svg]:px-6 [&_svg:not([class*='size-'])]:size-5",
        '2xl':
          "h-14  px-10 text-lg font-semibold has-[>svg]:px-8 [&_svg:not([class*='size-'])]:size-6",
        massive:
          "h-16  px-12 text-xl font-bold shadow-sm has-[>svg]:px-10 [&_svg:not([class*='size-'])]:size-7",

        icon: 'size-9',
        'icon-xs': "size-6  [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',

        'icon-xl': "size-12  [&_svg:not([class*='size-'])]:size-5",
        'icon-2xl': "size-14  [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot='button'
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }

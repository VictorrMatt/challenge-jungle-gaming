import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Slot } from 'radix-ui'

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-bold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,opacity,scale] duration-200 ease-out outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /** Orange filled CTA ("COMPRAR", "Entrar", "Aplicar"). */
        default:
          'bg-primary text-primary-foreground hover:bg-highlight hover:shadow-[0_8px_24px_-10px_var(--kurio-400)]',
        /** Mobile pill CTA with the Figma gradient ("Comprar NFT", "Confirmar compra"). */
        gradient:
          'rounded-full gradient-primary text-primary-foreground hover:shadow-[0_10px_28px_-12px_var(--kurio-400)] hover:brightness-110',
        destructive: 'bg-destructive text-primary-foreground hover:bg-destructive/90',
        /** Orange hairline ("Favoritar"). */
        outline:
          'border border-primary bg-transparent text-highlight hover:bg-primary/10 aria-pressed:bg-primary/15',
        /** Dark bordered ("Continuar com Google"). */
        secondary:
          'border border-input bg-transparent font-normal text-muted-foreground hover:border-primary/60 hover:text-foreground',
        ghost: 'font-normal text-foreground hover:bg-accent hover:text-highlight',
        link: 'h-auto px-0 font-normal text-highlight underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-6 has-[>svg]:px-4',
        xs: "h-6 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-9 gap-1.5 px-4 has-[>svg]:px-2.5',
        lg: 'h-11 px-8 text-base has-[>svg]:px-6',
        xl: 'h-[3.75rem] px-8 text-base',
        icon: 'size-10',
        'icon-xs': "size-6 [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-11',
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
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

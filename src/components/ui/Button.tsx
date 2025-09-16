"use client"

import { twMerge } from 'tailwind-merge'

type Variant = 'primary' | 'secondary' | 'outline'

export default function Button({
  children,
  className,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base = 'inline-flex items-center justify-center rounded-2xl px-5 h-12 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
  const styles: Record<Variant, string> = {
    primary: 'bg-black text-white hover:opacity-95',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    outline: 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50'
  }
  return (
    <button className={twMerge(base, styles[variant], className)} {...props}>
      {children}
    </button>
  )
}



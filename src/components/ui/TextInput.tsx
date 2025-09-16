"use client"

import { twMerge } from 'tailwind-merge'

export default function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const base = 'w-full h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base shadow-sm outline-none ring-emerald-600/20 focus:border-emerald-600 focus:ring-4 placeholder:text-gray-400'
  return <input className={twMerge(base, className)} {...props} />
}



"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'

const links = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/scrape', label: 'Add Recipes' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <AuthGuard>
      <div className="min-h-screen">
        <div className="border-b bg-white">
          <div className="container mx-auto px-4 h-12 flex items-center gap-4 text-sm">
            {links.map(l => (
              <Link key={l.href} href={l.href} className={`px-3 py-1.5 rounded ${pathname === l.href ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}>{l.label}</Link>
            ))}
          </div>
        </div>
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </div>
    </AuthGuard>
  )
}

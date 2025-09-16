"use client"

import AuthGuard from '@/components/auth/AuthGuard'
import AuthStatus from '@/components/auth/AuthStatus'

export default function DashboardPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <AuthStatus />
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="border rounded p-4">Your recipes</div>
            <div className="border rounded p-4">Inventory</div>
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}

import { SupabaseTest } from '@/components/supabase-test'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Food Manager
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Smart Recipe & Inventory Management System
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Food Manager</h2>
            <p className="text-gray-600 mb-6">
              A comprehensive food management system featuring:
            </p>
            <ul className="text-left space-y-2 text-gray-600 mb-6">
              <li>• Recipe scraping from YouTube, Instagram, and TikTok</li>
              <li>• Smart inventory tracking and expiry alerts</li>
              <li>• Meal planning and shopping list generation</li>
              <li>• Receipt scanning with OCR</li>
              <li>• Nutrition tracking and analysis</li>
            </ul>
            
            <div className="mb-6">
              <SupabaseTest />
            </div>
            
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link href="/login" className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                Login
              </Link>
              <Link href="/signup" className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

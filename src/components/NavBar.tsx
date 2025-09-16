"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

// Animation variants inspired by your Framer code
const withHover = (Component: any) => {
  return motion(Component)
}

const withRotate = (Component: any) => {
  return motion(Component)
}

export default function NavBar() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <>
      <header className="bg-white">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Link href="/" className="font-semibold text-xl text-green-800">
                <div>Kickis Food -</div>
                <div>Recipe Manager</div>
              </Link>
            </motion.div>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm text-gray-800">
              <motion.div 
                className="flex items-center gap-1 cursor-pointer hover:text-gray-900"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <span>Product</span>
                <motion.svg 
                  className="w-3 h-3" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </motion.div>
              <motion.div 
                className="flex items-center gap-1 cursor-pointer hover:text-gray-900"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <span>Resources</span>
                <motion.svg 
                  className="w-3 h-3" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </motion.div>
              <motion.div 
                className="flex items-center gap-1 cursor-pointer hover:text-gray-900"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <span>Community</span>
                <motion.svg 
                  className="w-3 h-3" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </motion.div>
            </nav>
            <div className="flex items-center gap-3 text-sm">
              {!email ? (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href="/signup" className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium">
                    SIGNUP
                  </Link>
                </motion.div>
              ) : (
                <>
                  <span className="hidden sm:inline text-gray-600">{email}</span>
                  <motion.button
                    className="px-3 py-1.5 rounded border hover:bg-gray-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={async () => {
                      await supabase.auth.signOut()
                      window.location.href = '/'
                    }}
                  >
                    Sign out
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="border-b border-gray-300"></div>
    </>
  )
}

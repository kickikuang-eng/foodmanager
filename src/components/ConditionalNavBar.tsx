"use client"

import { usePathname } from 'next/navigation'
import NavBar from './NavBar'

export default function ConditionalNavBar() {
  const pathname = usePathname()
  
  // Don't show NavBar on the landing page (home page)
  // The landing page has its own built-in navigation
  if (pathname === '/') {
    return null
  }
  
  // Show NavBar on all other pages (dashboard, login, signup, etc.)
  return <NavBar />
}

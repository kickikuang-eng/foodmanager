import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import ConditionalNavBar from '@/components/ConditionalNavBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kickis Food - Recipe Manager',
  description: 'Generate recipes from YouTube, Instagram, and TikTok videos. Smart recipe management made simple.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConditionalNavBar />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

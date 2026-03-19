import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'EatWell',
  description: 'Household meal planner',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">
        <main className="max-w-2xl mx-auto pb-24 min-h-screen">{children}</main>
        <NavBar />
      </body>
    </html>
  )
}

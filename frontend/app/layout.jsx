import './globals.css'
import { Inter } from 'next/font/google'
import Header from '@/components/Header'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata = {
  title: 'AgriEquity AI',
  description: 'AI-Powered Farm Yield · Climate Risk · Fair Subsidies',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased flex flex-col">
        <div className="grain-overlay" aria-hidden />
        <Header />
        <main className="relative z-10 flex-1">
          {children}
        </main>
        <footer className="site-footer">
          Powered by PyTorch · OR-Tools
        </footer>
      </body>
    </html>
  )
}

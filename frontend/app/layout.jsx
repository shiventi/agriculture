import './globals.css'
import { Inter } from 'next/font/google'

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
      <body className="min-h-screen bg-deep-green text-cream antialiased flex flex-col">
        <div className="grain-overlay" aria-hidden />
        <header className="relative z-10 border-b border-cream/10">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <h1 className="text-2xl font-semibold text-gold tracking-tight">
              AgriEquity AI
            </h1>
            <p className="mt-0.5 text-sm text-cream/90">
              AI-Powered Farm Yield · Climate Risk · Fair Subsidies
            </p>
          </div>
        </header>
        <main className="relative z-10 flex-1">
          {children}
        </main>
        <footer className="relative z-10 border-t border-cream/10 py-3 text-center text-xs text-cream/70">
          Powered by PyTorch · OR-Tools · Claude AI
        </footer>
      </body>
    </html>
  )
}

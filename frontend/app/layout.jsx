import './globals.css'
import { Inter } from 'next/font/google'
import { ResultsProvider } from '@/contexts/ResultsContext'
import { ThemeProvider } from '@/components/ThemeProvider'
import Header from '@/components/Header'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata = {
  title: 'AgriEquity AI',
  description: 'AI-powered farm yield · Climate risk · Fair subsidies',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-palette-background dark:text-foreground antialiased flex flex-col transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <div className="grain-overlay" aria-hidden />
          <ResultsProvider>
            <Header />
            <main className="page-bg relative z-10 flex-1 bg-zinc-50 dark:bg-[#2d4433] transition-colors duration-200">
              {children}
            </main>
            <footer className="site-footer">
              Powered by PyTorch · OR-Tools
            </footer>
          </ResultsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

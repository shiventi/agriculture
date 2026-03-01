import './globals.css'
import { Inter } from 'next/font/google'
import { ResultsProvider } from '@/contexts/ResultsContext'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeClassSync } from '@/components/ThemeClassSync'
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
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ThemeClassSync />
          <div className="grain-overlay" aria-hidden />
          <ResultsProvider>
            <Header />
            <main className="relative z-10 flex-1">
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

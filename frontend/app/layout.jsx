import './globals.css'
import { DM_Sans } from 'next/font/google'
import { ResultsProvider } from '@/contexts/ResultsContext'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeClassSync } from '@/components/ThemeClassSync'
import Header from '@/components/Header'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-dm-sans',
})

export const metadata = {
  title: 'PitchFork',
  description: 'AI-powered farm yield · Climate risk · Fair subsidies',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSans.className}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.add('theme-light');document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');document.documentElement.classList.remove('theme-light');}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ThemeClassSync />
          <div className="grain-overlay" aria-hidden />
          <ResultsProvider>
            <Header />
            <main className="main-content relative z-10 flex-1">
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

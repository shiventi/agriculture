import './globals.css'

export const metadata = {
  title: 'Agriculture',
  description: 'Agriculture app',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

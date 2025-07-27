import type { Metadata } from 'next'
import { Outfit, Fira_Code } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
})

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: 'Trustfall Protocol Simulator',
  description: 'Comprehensive simulation dashboard for Trustfall Protocol economic and behavioral scenarios',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="preload"
          href="/fonts/PKMN RBYGSC.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${outfit.variable} ${firaCode.variable} font-sans antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  )
} 
import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  weight: ['300', '400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'SarakEdge — Command Nexus',
  description:
    'Store-Carry-Forward logistics telemetry dashboard. Real-time DTN resilience monitoring for edge nodes. HackHustle 2026.',
  keywords: ['DTN', 'telemetry', 'logistics', 'edge computing', 'IoT', 'SarakEdge'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-base text-text-1 antialiased">
        {children}
      </body>
    </html>
  )
}

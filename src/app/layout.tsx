import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { ToastProvider } from '@/components/ui/toast'
import { TelegramProvider } from '@/components/telegram-provider'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Outlivion VPN',
  description: 'Быстрый и безопасный VPN сервис',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </head>
      <body className={inter.className}>
        <TelegramProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </TelegramProvider>
      </body>
    </html>
  )
}


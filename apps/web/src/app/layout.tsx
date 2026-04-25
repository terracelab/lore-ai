import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://lore-ai.vercel.app'),
  title: {
    default: 'Lore AI — Living business-logic documentation',
    template: '%s · Lore AI',
  },
  description:
    'Lore AI extracts annotated business logic from Python and TypeScript code so AI editors (Claude Code, Copilot, Cursor) understand domain context.',
  openGraph: {
    title: 'Lore AI',
    description: 'Living business-logic documentation for AI-assisted dev teams.',
    url: 'https://lore-ai.vercel.app',
    siteName: 'Lore AI',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lore AI',
    description: 'Living business-logic documentation for AI-assisted dev teams.',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

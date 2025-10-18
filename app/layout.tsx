import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { ModalProvider } from '@/contexts/modal-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Video Platform Admin',
  description: 'Video Management Platform',
  manifest: '/manifest.json',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
        >
          <ModalProvider>
            {children}
            <Toaster
              theme="dark"
              toastOptions={{
                style: {
                  background: '#0a0a0a',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            />
          </ModalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

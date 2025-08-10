'use client';
import { AuthProvider } from '@/context/AuthProvider';
import { ThemeProvider } from '@/context/ThemeProvider';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
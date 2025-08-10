'use client';
import { useState, useEffect } from 'react';
import { ThemeProvider } from '@emotion/react';
import { lightTheme, darkTheme } from '@/styles/theme';

export default function ThemeWrapper({ children }) {
  const [theme, setTheme] = useState(lightTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? darkTheme : lightTheme);

    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setTheme(e.matches ? darkTheme : lightTheme);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (!mounted) {
    return null;
  }

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

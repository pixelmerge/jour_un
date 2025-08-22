'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { lightTheme, darkTheme } from '@/styles/theme';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  themeObject: lightTheme
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const rawTheme = theme === 'light' ? lightTheme : darkTheme;
  // Provide backward-compatible aliases expected by components:
  // - keep rawTheme.background as an object (so theme.background.secondary still works)
  // - make theme.background coercible to a string (so ${theme.background} yields the primary color)
  // - keep rawTheme.palette available for new styles
  const themeObject = {
    ...rawTheme,
    background: {
      ...(rawTheme.background || {}),
      toString() {
        return (rawTheme.background && rawTheme.background.primary) || rawTheme.backgroundColor || '#fff';
      }
    },
    // explicit convenience alias for consumers that expect a simple string
    backgroundColor: (rawTheme.background && rawTheme.background.primary) || rawTheme.backgroundColor || '#fff'
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeObject }}>
      <EmotionThemeProvider theme={themeObject}>
        {children}
      </EmotionThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
const baseTheme = {
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '1rem',
    xl: '1.5rem',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  transition: {
    fast: '0.15s ease',
    normal: '0.25s ease',
    slow: '0.35s ease',
  },
};

export const lightTheme = {
  ...baseTheme,
  background: {
    primary: '#ffffff',
    secondary: '#f8f9fa',
    hover: '#f1f3f5',
    accent: '#e9ecef'
  },
  text: {
    primary: '#212529',
    secondary: '#495057',
    muted: '#868e96',
    accent: '#2563eb'
  },
  border: {
    primary: '#dee2e6',
    secondary: '#e9ecef'
  },
  card: {
    background: '#ffffff',
    border: '#e5e7eb',
    hover: '#f8fafc'
  },
  primaryButton: {
    background: '#2563eb',
    text: '#ffffff',
    hover: '#1d4ed8'
  },
  error: '#dc2626',
  success: '#16a34a',
  warning: '#ca8a04'
};

export const darkTheme = {
  ...baseTheme,
  background: {
    primary: '#111827',
    secondary: '#1f2937',
    hover: '#374151',
    accent: '#4b5563'
  },
  text: {
    primary: '#f9fafb',
    secondary: '#e5e7eb',
    muted: '#9ca3af',
    accent: '#3b82f6'
  },
  border: {
    primary: '#374151',
    secondary: '#4b5563'
  },
  card: {
    background: '#1f2937',
    border: '#374151',
    hover: '#2d3748'
  },
  primaryButton: {
    background: '#3b82f6',
    text: '#ffffff',
    hover: '#2563eb'
  },
  error: '#ef4444',
  success: '#22c55e',
  warning: '#eab308'
};
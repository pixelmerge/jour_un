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

// Palette inspired from the provided screenshot
// - soft green: #6D9773
// - deep green: #0C3B2E
// - warm brown: #B46617
// - bright yellow: #FFBA00

export const lightTheme = {
  ...baseTheme,
  // semantic palette
  palette: {
    softGreen: '#6D9773',
    deepGreen: '#0C3B2E',
    warmBrown: '#B46617',
    brightYellow: '#FFBA00',
    neutralLight: '#F6FBF7',
    neutral: '#F2F6F3'
  },
  // Keep older semantic fields for compatibility.
  background: {
    primary: '#F6FBF7',
    secondary: '#FFFFFF',
    hover: '#EEF7EE',
    accent: '#F2F6F3'
  },
  // backward compatible alias: theme.background used in some components
  // keep a string value that maps to the primary background color
  backgroundColor: '#F6FBF7',
  text: {
    primary: '#0B2B20', // dark green-ish for readability on light background
    secondary: '#254032',
    muted: '#6B7F72',
    accent: '#0C3B2E'
  },
  border: {
    primary: '#E6EFE6',
    secondary: '#F2F6F3'
  },
  card: {
    background: '#FFFFFF',
    border: '#E6EFE6',
    hover: '#F7FBF8'
  },
  primaryButton: {
    background: '#0C3B2E',
    text: '#FFFFFF',
    hover: '#0a2f24'
  },
  secondaryButton: {
    background: '#6D9773',
    text: '#0B2B20',
    hover: '#5f8568'
  },
  accent: {
    warm: '#B46617',
    bright: '#FFBA00'
  },
  error: '#DC2626',
  success: '#16A34A',
  warning: '#FFBA00'
};

export const darkTheme = {
  ...baseTheme,
  palette: {
    softGreen: '#6D9773',
    deepGreen: '#0C3B2E',
    warmBrown: '#B46617',
    brightYellow: '#FFBA00',
    neutralDark: '#071612',
    neutral: '#0B2B20'
  },
  background: {
    primary: '#071612', // very dark green tint
    secondary: '#0B2B20',
    hover: '#082E1F',
    accent: '#0F3E2F'
  },
  // compatibility alias
  backgroundColor: '#071612',
  text: {
    primary: '#E8F6EE',
    secondary: '#CFE9D8',
    muted: '#95A79A',
    accent: '#6D9773'
  },
  border: {
    primary: '#0E2E23',
    secondary: '#123826'
  },
  card: {
    background: '#082E1F',
    border: '#0E2E23',
    hover: '#0B3B2B'
  },
  primaryButton: {
    background: '#6D9773',
    text: '#071612',
    hover: '#5f8568'
  },
  secondaryButton: {
    background: '#0C3B2E',
    text: '#E8F6EE',
    hover: '#0a3227'
  },
  accent: {
    warm: '#B46617',
    bright: '#FFBA00'
  },
  error: '#EF4444',
  success: '#22C55E',
  warning: '#FFBA00'
};
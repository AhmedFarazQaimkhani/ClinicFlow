import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    consult: string;
    repeat: string;
    waiting: string;
  }
  interface PaletteOptions {
    consult?: string;
    repeat?: string;
    waiting?: string;
  }
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0F766E', dark: '#115E59', light: '#2DD4BF', contrastText: '#fff' },
    secondary: { main: '#1D4ED8', dark: '#1E3A8A', light: '#60A5FA' },
    background: { default: '#F0F7F7', paper: '#FFFFFF' },
    text: { primary: '#134E4A', secondary: '#5B7475' },
    success: { main: '#047857' },
    warning: { main: '#C2410C' },
    info: { main: '#1D4ED8' },
    error: { main: '#B91C1C' },
    divider: '#D4E6E4',
    consult: '#1D4ED8',
    repeat: '#047857',
    waiting: '#C2410C',
  },
  typography: {
    fontFamily: '"DM Sans", "Noto Nastaliq Urdu", "Segoe UI", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, letterSpacing: '-0.03em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: 'none', letterSpacing: 0 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48,
          paddingLeft: 20,
          paddingRight: 20,
          fontSize: '1rem',
          borderRadius: 12,
          boxShadow: 'none',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        outlined: {
          borderColor: '#B7D4D1',
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          background: '#fff',
          borderRadius: 12,
        },
        input: {
          paddingTop: 16,
          paddingBottom: 16,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #D4E6E4',
          boxShadow: '0 8px 24px rgba(15, 118, 110, 0.05)',
          borderRadius: 16,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
  },
});

export default theme;

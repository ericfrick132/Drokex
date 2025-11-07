import { createTheme } from '@mui/material/styles';

// Colores Drokex según styleguide.txt
export const drokexColors = {
  // Colores Primarios
  primary: '#abd305',      // Verde lima
  dark: '#161616',         // Negro
  light: '#fcffee',        // Crema
  
  // Colores Secundarios
  secondary: '#006d5a',    // Verde teal
  pale: '#d5ddb7',         // Verde pálido
  
  // Estados
  success: '#abd305',
  error: '#d32f2f',
  warning: '#ed6c02',
  info: '#006d5a',
} as const;

// Tipografías Drokex según styleguide.txt
export const drokexFonts = {
  heading: '"Nagoda", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  body: '"Manrope", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
} as const;

// Tema personalizado Drokex
export const drokexTheme = createTheme({
  palette: {
    primary: {
      main: drokexColors.primary,      // Verde lima
      dark: drokexColors.secondary,    // Verde teal
      light: drokexColors.pale,        // Verde pálido
      contrastText: drokexColors.dark, // Negro
    },
    secondary: {
      main: drokexColors.secondary,    // Verde teal
      dark: '#004d3f',
      light: '#339584',
      contrastText: '#ffffff',
    },
    background: {
      default: drokexColors.light,     // Crema
      paper: '#ffffff',
    },
    text: {
      primary: drokexColors.dark,      // Negro
      secondary: drokexColors.secondary, // Verde teal
    },
    error: {
      main: drokexColors.error,
    },
    warning: {
      main: drokexColors.warning,
    },
    info: {
      main: drokexColors.info,
    },
    success: {
      main: drokexColors.success,
    },
  },
  typography: {
    fontFamily: drokexFonts.body,
    // Tipografía Nagoda para títulos
    h1: {
      fontFamily: drokexFonts.heading,
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      color: drokexColors.dark,
    },
    h2: {
      fontFamily: drokexFonts.heading,
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
      color: drokexColors.dark,
    },
    h3: {
      fontFamily: drokexFonts.heading,
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      color: drokexColors.dark,
    },
    h4: {
      fontFamily: drokexFonts.heading,
      fontWeight: 700,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      color: drokexColors.dark,
    },
    h5: {
      fontFamily: drokexFonts.heading,
      fontWeight: 700,
      fontSize: '1.1rem',
      lineHeight: 1.4,
      color: drokexColors.dark,
    },
    h6: {
      fontFamily: drokexFonts.heading,
      fontWeight: 700,
      fontSize: '1rem',
      lineHeight: 1.4,
      color: drokexColors.dark,
    },
    // Tipografía Manrope para cuerpo
    body1: {
      fontFamily: drokexFonts.body,
      fontSize: '1rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    body2: {
      fontFamily: drokexFonts.body,
      fontSize: '0.875rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    subtitle1: {
      fontFamily: drokexFonts.body,
      fontSize: '1rem',
      lineHeight: 1.5,
      fontWeight: 500,
    },
    subtitle2: {
      fontFamily: drokexFonts.body,
      fontSize: '0.875rem',
      lineHeight: 1.5,
      fontWeight: 500,
    },
    caption: {
      fontFamily: drokexFonts.body,
      fontSize: '0.75rem',
      lineHeight: 1.4,
      fontWeight: 400,
      color: drokexColors.secondary,
    },
    button: {
      fontFamily: drokexFonts.body,
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    // Botones con estilo Drokex
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          padding: '10px 24px',
          borderRadius: 8,
          fontFamily: drokexFonts.body,
        },
        contained: {
          backgroundColor: drokexColors.primary,
          color: drokexColors.dark,
          boxShadow: '0 2px 4px rgba(171, 211, 5, 0.2)',
          '&:hover': {
            backgroundColor: drokexColors.secondary,
            color: '#ffffff',
            boxShadow: '0 4px 8px rgba(0, 109, 90, 0.3)',
          },
        },
        outlined: {
          borderColor: drokexColors.primary,
          color: drokexColors.primary,
          '&:hover': {
            borderColor: drokexColors.secondary,
            backgroundColor: 'rgba(0, 109, 90, 0.04)',
            color: drokexColors.secondary,
          },
        },
        text: {
          color: drokexColors.secondary,
          '&:hover': {
            backgroundColor: 'rgba(0, 109, 90, 0.04)',
            color: drokexColors.secondary,
          },
        },
      },
    },
    // Cards con estilo Drokex
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(22, 22, 22, 0.12), 0 1px 2px rgba(22, 22, 22, 0.24)',
          borderRadius: 12,
          '&:hover': {
            boxShadow: '0 4px 8px rgba(22, 22, 22, 0.15), 0 2px 4px rgba(22, 22, 22, 0.12)',
          },
        },
      },
    },
    // Inputs con estilo Drokex
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: drokexColors.secondary,
              borderWidth: 2,
            },
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: drokexColors.secondary,
          },
        },
      },
    },
    // AppBar/Header con colores Drokex
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: drokexColors.dark,
          color: '#ffffff',
        },
      },
    },
    // Chips con estilo Drokex
    MuiChip: {
      styleOverrides: {
        filled: {
          backgroundColor: drokexColors.pale,
          color: drokexColors.dark,
          '&.MuiChip-colorPrimary': {
            backgroundColor: drokexColors.primary,
            color: drokexColors.dark,
          },
          '&.MuiChip-colorSecondary': {
            backgroundColor: drokexColors.secondary,
            color: '#ffffff',
          },
        },
      },
    },
  },
});

export default drokexTheme;

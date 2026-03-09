import React from 'react';
import { AppBar, Toolbar, Box, Button, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DrokexLogo } from '../common';
import { drokexColors } from '../../theme/drokexTheme';

const PublicNavbar: React.FC = () => {
  const navigate = useNavigate();

  const linkSx = {
    color: '#000000',
    fontWeight: 500,
    fontSize: '0.95rem',
    textDecoration: 'none',
    mx: 1.5,
    '&:hover': { color: drokexColors.primary },
  } as const;

  return (
    <AppBar position="sticky" elevation={0} sx={{ backgroundColor: '#ffffff', borderBottom: `1px solid rgba(0,0,0,0.08)`, position: 'relative' }}>
      <Toolbar sx={{ minHeight: 56, display: 'flex', alignItems: 'center' }}>
        {/* Brand - Left */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box onClick={() => navigate('/')} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <img src="/assets/logo-entero-negro.png" alt="Drokex Logo" style={{ height: '40px', cursor: 'pointer' }} />
          </Box>
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Navigation Links - Right */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', mr: 3 }}>
          <Link href="#servicios" sx={linkSx}>
            Servicios
          </Link>
          <Link href="#planes" sx={linkSx}>
            Planes
          </Link>
          <Link href="#beneficios" sx={linkSx}>
            Beneficios
          </Link>
          <Link href="/about" sx={linkSx}>
            Sobre nosotros
          </Link>
          <Link href="/catalog" sx={linkSx}>
            Productos
          </Link>
          <Link href="/companies" sx={linkSx}>
            Directorio
          </Link>
        </Box>

        {/* Action Buttons - Far Right */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            color="inherit"
            onClick={() => navigate('/login')}
            sx={{
              color: '#000000',
              textTransform: 'none',
              '&:hover': { color: drokexColors.primary, backgroundColor: 'transparent' },
            }}
          >
            Iniciar sesión
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/register-choice')}
            sx={{
              backgroundColor: drokexColors.primary,
              color: '#ffffff',
              textTransform: 'none',
              '&:hover': { backgroundColor: drokexColors.secondary, color: '#ffffff' },
            }}
          >
            Regístrate
          </Button>
        </Box>
      </Toolbar>
      {/* Brand strength stripe */}
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${drokexColors.primary}, ${drokexColors.secondary})` }} />
    </AppBar>
  );
};

export default PublicNavbar;

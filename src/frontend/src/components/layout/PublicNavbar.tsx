import React from 'react';
import { AppBar, Toolbar, Box, Button, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DrokexLogo } from '../common';
import { drokexColors } from '../../theme/drokexTheme';

const PublicNavbar: React.FC = () => {
  const navigate = useNavigate();

  const linkSx = {
    color: '#ffffff',
    fontWeight: 500,
    fontSize: '0.95rem',
    textDecoration: 'none',
    mx: 1.5,
    '&:hover': { color: drokexColors.primary },
  } as const;

  return (
    <AppBar position="sticky" elevation={0} sx={{ backgroundColor: drokexColors.dark, borderBottom: `1px solid rgba(255,255,255,0.08)`, position: 'relative' }}>
      <Toolbar sx={{ minHeight: 56, display: 'flex', alignItems: 'center' }}>
        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box onClick={() => navigate('/')} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <DrokexLogo variant="full" size="medium" color="white" withMargin={false} />
          </Box>
        </Box>

        {/* Left nav */}
        <Box sx={{ ml: 3, display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
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
            Quiénes somos
          </Link>
          <Link href="/catalog" sx={linkSx}>
            Productos
          </Link>
          <Link href="/companies" sx={linkSx}>
            Directorio
          </Link>
        </Box>

        {/* Right actions */}
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            color="inherit"
            onClick={() => navigate('/login')}
            sx={{
              color: '#ffffff',
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
              color: drokexColors.dark,
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

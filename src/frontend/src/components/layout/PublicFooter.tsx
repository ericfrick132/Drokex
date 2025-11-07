import React from 'react';
import { Box, Container, Grid, Typography, Link, Stack, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { drokexColors } from '../../theme/drokexTheme';
import { DrokexLogo, DrokexButton } from '../common';
import { useTenant } from '../../contexts/TenantContext';

const footerLinkSx = {
  color: 'rgba(255,255,255,0.85)',
  textDecoration: 'none',
  '&:hover': { color: drokexColors.primary },
  fontSize: '0.95rem',
} as const;

const PublicFooter: React.FC = () => {
  const { tenant, getCountryFlag } = useTenant();

  return (
    <Box component="footer" sx={{ mt: 6, backgroundColor: drokexColors.dark, color: '#fff' }}>
      {/* Brand stripe */}
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${drokexColors.primary}, ${drokexColors.secondary})` }} />

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <DrokexLogo variant="full" size="medium" color="white" withMargin={false} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Conectando empresas de LATAM con compradores internacionales.
              </Typography>
              <DrokexButton
                variant="primary"
                onClick={() => (window.location.href = '/register-choice')}
                sx={{ alignSelf: 'flex-start' }}
              >
                Comenzar
              </DrokexButton>
            </Stack>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Explora</Typography>
            <Stack spacing={1}>
              <Link component={RouterLink} to="/catalog" sx={footerLinkSx}>Productos</Link>
              <Link component={RouterLink} to="/companies" sx={footerLinkSx}>Directorio</Link>
              <Link component={RouterLink} to="/register-choice" sx={footerLinkSx}>Regístrate</Link>
            </Stack>
          </Grid>

          <Grid item xs={6} md={3}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Para Empresas</Typography>
            <Stack spacing={1}>
              <Link component={RouterLink} to="/register" sx={footerLinkSx}>Registrar Empresa</Link>
              <Link component={RouterLink} to="/login" sx={footerLinkSx}>Iniciar Sesión</Link>
              <Link component={RouterLink} to="/catalog" sx={footerLinkSx}>Publicar Productos</Link>
            </Stack>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Contacto</Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                Email: soporte@drokex.com
              </Typography>
              {tenant && (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  Región: {getCountryFlag()} {tenant.country} • Moneda: {tenant.currencySymbol || tenant.currency}
                </Typography>
              )}
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            © {new Date().getFullYear()} Drokex. Todos los derechos reservados.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Link href="#" sx={footerLinkSx}>Términos</Link>
            <Link href="#" sx={footerLinkSx}>Privacidad</Link>
            <Link href="#" sx={footerLinkSx}>Soporte</Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default PublicFooter;


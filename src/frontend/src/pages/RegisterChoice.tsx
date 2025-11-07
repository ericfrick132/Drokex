import React from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';
import { DrokexPattern, DrokexCard, DrokexCardContent, DrokexButton, DrokexLogo } from '../components/common';
import { drokexColors } from '../theme/drokexTheme';
import { Storefront, Search as SearchIcon } from '@mui/icons-material';
import PublicNavbar from '../components/layout/PublicNavbar';
import PublicFooter from '../components/layout/PublicFooter';
import { useNavigate } from 'react-router-dom';

const RegisterChoice: React.FC = () => {
  const navigate = useNavigate();

  return (
    <DrokexPattern pattern="diagonal" opacity={0.03}>
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: drokexColors.light }}>
        <PublicNavbar />
        <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <DrokexLogo variant="full" size="large" color="primary" />
            <Typography variant="h4" sx={{ color: drokexColors.dark, fontWeight: 700, mt: 2, mb: 1 }}>
              Elige cómo quieres empezar
            </Typography>
            <Typography variant="body1" sx={{ color: drokexColors.secondary }}>
              Crea tu cuenta como proveedor o como comprador. Puedes explorar el catálogo sin registrarte.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <DrokexCard variant="interactive">
                <DrokexCardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Storefront sx={{ color: drokexColors.secondary }} />
                    <Typography variant="h6" sx={{ color: drokexColors.dark, fontWeight: 700 }}>
                      Quiero vender (Proveedor)
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: drokexColors.secondary, mb: 2 }}>
                    Registra tu empresa, sube tu portafolio y publica productos para que te encuentren compradores internacionales.
                  </Typography>
                  <DrokexButton variant="primary" onClick={() => navigate('/register')}>
                    Registrar mi Empresa
                  </DrokexButton>
                </DrokexCardContent>
              </DrokexCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <DrokexCard variant="interactive">
                <DrokexCardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <SearchIcon sx={{ color: drokexColors.secondary }} />
                    <Typography variant="h6" sx={{ color: drokexColors.dark, fontWeight: 700 }}>
                      Quiero comprar / buscar
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: drokexColors.secondary, mb: 2 }}>
                    Crea tu cuenta de comprador para guardar favoritos, seguir proveedores y enviar consultas.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <DrokexButton variant="primary" onClick={() => navigate('/signup')}>
                      Registrarme como Comprador
                    </DrokexButton>
                    <DrokexButton variant="ghost" onClick={() => navigate('/catalog')}>
                      Explorar Catálogo
                    </DrokexButton>
                  </Box>
                </DrokexCardContent>
              </DrokexCard>
            </Grid>
          </Grid>
        </Container>
        </Box>
        <PublicFooter />
      </Box>
    </DrokexPattern>
  );
};

export default RegisterChoice;

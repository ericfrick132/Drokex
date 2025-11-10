import React from 'react';
import { Box, Container, Typography, Grid, Chip } from '@mui/material';
import PublicNavbar from '../components/layout/PublicNavbar';
import PublicFooter from '../components/layout/PublicFooter';
import { DrokexPattern, DrokexCard, DrokexCardContent } from '../components/common';
import { drokexColors } from '../theme/drokexTheme';

const About: React.FC = () => {
  return (
    <Box sx={{ backgroundColor: drokexColors.light, minHeight: '100vh' }}>
      <PublicNavbar />
      <DrokexPattern pattern="gradient" opacity={0.06}>
        <Container maxWidth="lg" sx={{ pt: 8, pb: 6 }}>
          <Typography variant="h3" sx={{ color: drokexColors.dark, fontWeight: 600, mb: 2 }}>Quiénes Somos</Typography>
          <Typography variant="h6" sx={{ color: drokexColors.secondary, mb: 4 }}>
            Impulsamos a empresas de LATAM a expandirse al mundo con una plataforma simple, segura y enfocada en resultados.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <DrokexCard variant="elevated">
                <DrokexCardContent>
                  <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 600, mb: 2 }}>Nuestra Misión</Typography>
                  <Typography variant="body1" sx={{ color: drokexColors.secondary, mb: 3 }}>
                    Conectar proveedores latinoamericanos con compradores internacionales, simplificando procesos de descubrimiento, contacto y comercio, sin necesidad de presencia física en destino.
                  </Typography>
                  <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 600, mb: 2 }}>Nuestro Enfoque</Typography>
                  <Typography variant="body1" sx={{ color: drokexColors.secondary }}>
                    Apostamos por una experiencia ágil y confiable: catálogo claro, contacto directo mediante leads, y herramientas simples para empezar a exportar paso a paso.
                  </Typography>
                </DrokexCardContent>
              </DrokexCard>
            </Grid>
            <Grid item xs={12} md={4}>
              <DrokexCard>
                <DrokexCardContent>
                  <Typography variant="subtitle1" sx={{ color: drokexColors.dark, fontWeight: 600, mb: 1 }}>Valores</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {['Transparencia','Confianza','Velocidad','Colaboración'].map(v => <Chip key={v} label={v} />)}
                  </Box>
                </DrokexCardContent>
              </DrokexCard>
            </Grid>
          </Grid>
        </Container>
      </DrokexPattern>
      <PublicFooter />
    </Box>
  );
};

export default About;


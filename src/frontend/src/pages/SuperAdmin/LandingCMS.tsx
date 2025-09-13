import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, TextField } from '@mui/material';
import { DrokexCard, DrokexCardContent, DrokexButton } from '../../components/common';
import { drokexColors } from '../../theme/drokexTheme';

const STORAGE_KEY = 'cms-landing-overrides';

const LandingCMS: React.FC = () => {
  const [heroTitle, setHeroTitle] = useState('Conectamos proveedores de LATAM con compradores globales');
  const [heroSubtitle, setHeroSubtitle] = useState('Publica tus productos y recibe contactos de importadores');
  const [ctaText, setCtaText] = useState('Comenzar ahora');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        if (o.heroTitle) setHeroTitle(o.heroTitle);
        if (o.heroSubtitle) setHeroSubtitle(o.heroSubtitle);
        if (o.ctaText) setCtaText(o.ctaText);
      }
    } catch {}
  }, []);

  const save = () => {
    const data = { heroTitle, heroSubtitle, ctaText };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 3 }}>CMS Landing (mínimo)</Typography>
      <DrokexCard>
        <DrokexCardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField label="Título principal" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Subtítulo" value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Texto del botón (CTA)" value={ctaText} onChange={(e) => setCtaText(e.target.value)} fullWidth />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <DrokexButton variant="primary" onClick={save}>Guardar</DrokexButton>
            {saved && <Typography variant="body2" sx={{ color: drokexColors.secondary }}>Guardado</Typography>}
          </Box>
        </DrokexCardContent>
      </DrokexCard>
      <Typography variant="caption" sx={{ color: drokexColors.secondary, mt: 2, display: 'block' }}>
        Nota: Almacenado localmente en este navegador para demo. Puede integrarse con backend más adelante.
      </Typography>
    </Box>
  );
};

export default LandingCMS;


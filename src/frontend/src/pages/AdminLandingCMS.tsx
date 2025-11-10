import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, TextField, Alert } from '@mui/material';
import { DrokexCard, DrokexCardContent, DrokexButton } from '../components/common';
import { drokexColors } from '../theme/drokexTheme';
import { tenantsApi } from '../services/api';

const AdminLandingCMS: React.FC = () => {
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [loading, setLoading] = useState(false);
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [heroVideoPoster, setHeroVideoPoster] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await tenantsApi.getCms();
        const cms = data.data || {};
        if (cms.heroTitle) setHeroTitle(cms.heroTitle);
        if (cms.heroSubtitle) setHeroSubtitle(cms.heroSubtitle);
        if (cms.ctaText) setCtaText(cms.ctaText);
        if (cms.heroVideoUrl) setHeroVideoUrl(cms.heroVideoUrl);
        if (cms.heroVideoPoster) setHeroVideoPoster(cms.heroVideoPoster);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'No se pudo cargar el contenido');
      }
    })();
  }, []);

  const save = async () => {
    setLoading(true); setError(null); setSaved(null);
    try {
      await tenantsApi.updateCms({ heroTitle, heroSubtitle, ctaText, heroVideoUrl, heroVideoPoster });
      setSaved('Contenido guardado');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo guardar');
    } finally { setLoading(false); }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 3 }}>CMS Landing (tenant)</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2 }}>{saved}</Alert>}
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
            <Grid item xs={12} md={8}>
              <TextField label="Hero Video URL (opcional)" placeholder="https://.../video.mp4" value={heroVideoUrl} onChange={(e) => setHeroVideoUrl(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Poster (opcional)" placeholder="https://.../poster.jpg" value={heroVideoPoster} onChange={(e) => setHeroVideoPoster(e.target.value)} fullWidth />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <DrokexButton variant="primary" onClick={save} loading={loading}>Guardar</DrokexButton>
          </Box>
        </DrokexCardContent>
      </DrokexCard>
    </Box>
  );
};

export default AdminLandingCMS;

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Grid, TextField, Switch, FormControlLabel, Button, Divider, Chip } from '@mui/material';
import { DrokexCard, DrokexCardContent } from '../../components/common';
import superadminApi from '../../services/superadminApi';
import { drokexColors } from '../../theme/drokexTheme';

const TenantDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('superadmin_token');
    if (!token) { navigate('/superadmin/login', { replace: true }); return; }
    (async () => {
      const { data } = await superadminApi.getTenant(Number(id));
      setData(data.data);
    })();
  }, [id, navigate]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: data.name,
        adminEmail: data.adminEmail,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        logoUrl: data.logoUrl,
        customCss: data.customCss,
        timeZone: data.timeZone,
        languageCode: data.languageCode,
        planType: data.planType,
        transactionFeePercent: data.transactionFeePercent,
        allowsInternationalShipping: data.allowsInternationalShipping,
        isActive: data.isActive,
      };
      await superadminApi.updateTenant(Number(id), payload);
      navigate('/superadmin/tenants');
    } finally { setSaving(false); }
  };

  if (!data) return null;

  return (
    <Box>
      <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 3 }}>Editar Empresa</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <DrokexCard>
            <DrokexCardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: drokexColors.dark }}>Información general</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField label="Nombre" value={data.name || ''} onChange={e => setData({ ...data, name: e.target.value })} fullWidth />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Email Admin" value={data.adminEmail || ''} onChange={e => setData({ ...data, adminEmail: e.target.value })} fullWidth />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Plan" value={data.planType || ''} onChange={e => setData({ ...data, planType: e.target.value })} fullWidth />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField type="number" label="Fee (%)" value={data.transactionFeePercent || 0} onChange={e => setData({ ...data, transactionFeePercent: Number(e.target.value) })} fullWidth />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: drokexColors.dark }}>Branding y localización</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField label="Color Primario" value={data.primaryColor || ''} onChange={e => setData({ ...data, primaryColor: e.target.value })} fullWidth />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Color Secundario" value={data.secondaryColor || ''} onChange={e => setData({ ...data, secondaryColor: e.target.value })} fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Logo URL" value={data.logoUrl || ''} onChange={e => setData({ ...data, logoUrl: e.target.value })} fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="CSS Personalizado" value={data.customCss || ''} onChange={e => setData({ ...data, customCss: e.target.value })} fullWidth />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Zona Horaria" value={data.timeZone || ''} onChange={e => setData({ ...data, timeZone: e.target.value })} fullWidth />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Idioma" value={data.languageCode || ''} onChange={e => setData({ ...data, languageCode: e.target.value })} fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel control={<Switch checked={!!data.allowsInternationalShipping} onChange={e => setData({ ...data, allowsInternationalShipping: e.target.checked })} />} label="Permite envíos internacionales" />
                </Grid>
              </Grid>

              <Box mt={3} display="flex" gap={1.5} justifyContent="flex-end">
                <Button onClick={() => navigate('/superadmin/tenants')}>Cancelar</Button>
                <Button variant="contained" onClick={save} disabled={saving}>Guardar</Button>
              </Box>
            </DrokexCardContent>
          </DrokexCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <DrokexCard>
            <DrokexCardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: drokexColors.dark }}>Estado</Typography>
              <FormControlLabel control={<Switch checked={!!data.isActive} onChange={e => setData({ ...data, isActive: e.target.checked })} />} label="Activo" />
              <Box mt={2}>
                <Typography variant="caption" sx={{ color: drokexColors.secondary }}>Subdominio</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{data.subdomain || '-'}</Typography>
              </Box>
              <Box mt={2}>
                <Typography variant="caption" sx={{ color: drokexColors.secondary }}>País</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{data.country || '-'}</Typography>
              </Box>
              <Box mt={2}>
                <Typography variant="caption" sx={{ color: drokexColors.secondary }}>Moneda</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{data.currencySymbol} ({data.currency})</Typography>
              </Box>
            </DrokexCardContent>
          </DrokexCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TenantDetail;

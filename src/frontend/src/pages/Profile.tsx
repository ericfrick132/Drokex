import React from 'react';
import { Box, Grid, Typography, Chip, Stack, Divider } from '@mui/material';
import { DrokexCard, DrokexCardContent, DrokexButton, DrokexInput } from '../components/common';
import { useAuth } from '../contexts/AuthContext';
import { drokexColors } from '../theme/drokexTheme';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) {
    return null;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700 }}>Mi Perfil</Typography>
          <Typography variant="body2" sx={{ color: drokexColors.secondary, mt: 0.5 }}>
            Información de tu cuenta y sesión
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.25}>
          <Chip label={user.role} color="primary" sx={{ fontWeight: 600, textTransform: 'capitalize' }} />
          {user.companyId && (
            <DrokexButton variant="outline" onClick={() => navigate('/company')}>Mi Empresa</DrokexButton>
          )}
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={7}>
          <DrokexCard>
            <DrokexCardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: drokexColors.dark, mb: 2 }}>
                Datos personales
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <DrokexInput label="Nombre" value={user.firstName || ''} disabled />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DrokexInput label="Apellido" value={user.lastName || ''} disabled />
                </Grid>
                <Grid item xs={12}>
                  <DrokexInput label="Correo" type="email" value={user.email} disabled />
                </Grid>
                {user.companyName && (
                  <Grid item xs={12}>
                    <DrokexInput label="Empresa" value={user.companyName} disabled />
                  </Grid>
                )}
              </Grid>
            </DrokexCardContent>
          </DrokexCard>
        </Grid>

        <Grid item xs={12} md={5}>
          <DrokexCard variant="elevated">
            <DrokexCardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: drokexColors.dark, mb: 2 }}>
                Sesión
              </Typography>
              <Stack spacing={1.25}>
                <Box>
                  <Typography variant="caption" sx={{ color: drokexColors.secondary }}>Estado</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>Conectado</Typography>
                </Box>
                <Divider />
                <DrokexButton variant="secondary" onClick={handleLogout} disabled={isLoading}>
                  Cerrar sesión
                </DrokexButton>
              </Stack>
            </DrokexCardContent>
          </DrokexCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;


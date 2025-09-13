import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Link
} from '@mui/material';
import { Security, Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { DrokexPattern, DrokexCard, DrokexCardContent, DrokexInput, DrokexButton, DrokexLogo } from '../../components/common';
import { drokexColors } from '../../theme/drokexTheme';

const SuperAdminLogin: React.FC = () => {
  const navigate = useNavigate();
  // Prefill for demo based on DbSeeder (SuperAdmins)
  const [formData, setFormData] = useState({ email: 'admin@drokex.com', password: 'Admin@Drokex2024!' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/superadmin/auth/login', formData);
      if (response.data.success) {
        localStorage.setItem('superadmin_token', response.data.data.accessToken);
        localStorage.setItem('superadmin_refresh', response.data.data.refreshToken);
        localStorage.setItem('superadmin_data', JSON.stringify(response.data.data.superAdmin));
        navigate('/superadmin/dashboard');
      } else {
        setError(response.data.message || 'Error al iniciar sesión');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrokexPattern pattern="gradient" opacity={1}>
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 6 }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <DrokexLogo variant="full" size="medium" color="white" />
          </Box>

          <DrokexCard variant="elevated">
            <DrokexCardContent>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Security sx={{ fontSize: 40, color: drokexColors.secondary }} />
                <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700, mt: 1 }}>
                  Acceso Super Admin
                </Typography>
                <Typography variant="body2" sx={{ color: drokexColors.secondary }}>
                  Área restringida para administradores globales
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <DrokexInput
                  label="Email Administrativo"
                  value={formData.email}
                  onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                  type="email"
                  icon={<Email />}
                  placeholder="admin@drokex.com"
                  required
                  autoComplete="username"
                />

                <Box sx={{ height: 16 }} />

                <DrokexInput
                  label="Contraseña"
                  value={formData.password}
                  onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
                  type={showPassword ? 'text' : 'password'}
                  icon={<Lock />}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton aria-label="mostrar contraseña" onClick={() => setShowPassword(p => !p)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                <Box sx={{ mt: 3 }}>
                  <DrokexButton type="submit" variant="primary" loading={loading} fullWidth>
                    Ingresar
                  </DrokexButton>
                </Box>
              </Box>

              <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${drokexColors.pale}`, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: drokexColors.secondary }}>
                  Accesos no autorizados son registrados y monitoreados.
                </Typography>
              </Box>
            </DrokexCardContent>
          </DrokexCard>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link component="button" onClick={() => navigate('/login')} sx={{ color: 'white' }}>
              ← Volver al acceso normal
            </Link>
          </Box>
        </Container>
      </Box>
    </DrokexPattern>
  );
};

export default SuperAdminLogin;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Paper,
  Link,
  Divider,
  Tooltip,
  TextField,
  MenuItem,
} from '@mui/material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { 
  DrokexLogo, 
  DrokexButton, 
  DrokexInput, 
  DrokexCard, 
  DrokexCardContent,
  DrokexPattern 
} from '../components/common';
import { drokexColors } from '../theme/drokexTheme';
import { Email, Lock } from '@mui/icons-material';
import PublicNavbar from '../components/layout/PublicNavbar';

const Login: React.FC = () => {
  // Prefill for demo based on DbSeeder
  const [email, setEmail] = useState('admin@cafemonteverde.hn');
  const [password, setPassword] = useState('Admin123!');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const { login, isLoading, error } = useAuth();
  const { tenant, getCountryFlag } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Redirigir a SuperAdmin si corresponde; tenant se resuelve por subdominio
  useEffect(() => {
    try {
      const sat = localStorage.getItem('superadmin_token');
      if (sat) navigate('/superadmin/dashboard', { replace: true });
    } catch {}
  }, [navigate]);

  // Prefill demo credentials (tenant resuelto por subdominio)
  useEffect(() => {
    const host = window.location.hostname.toLowerCase();
    const sub = host.split('.')[0];
    const emailMap: Record<string, string> = {
      honduras: 'admin@cafemonteverde.hn',
      guatemala: 'admin@textilesmaya.gt',
      mexico: 'admin@aguacatesmichoacan.mx',
    };
    setEmail(emailMap[sub] || 'admin@cafemonteverde.hn');
    setPassword('Admin123!');
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // Realiza login central y redirecciona al subdominio del tenant con token
      const resp = await (await import('../services/api')).authApi.login({ email, password });
      if (resp.data.success && resp.data.data) {
        const { token, user } = resp.data.data as any;
        const sub = user?.tenantSubdomain;
        if (sub) {
          const devBase = `http://${sub}.localhost:3100`;
          const prodBase = `https://${sub}.drokex.com`;
          const base = window.location.hostname.includes('localhost') ? devBase : prodBase;
          const url = `${base}/api/auth/impersonate-login?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(base + '/dashboard')}`;
          window.location.href = url;
          return;
        }
        // fallback si no hay subdominio (debería existir): navegar normal
        await login({ email, password });
        navigate(from, { replace: true });
      }
    } catch (error) {
      // Error handled by context
    }
  };

  return (
    <DrokexPattern pattern="diagonal" opacity={0.03}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: drokexColors.light,
          padding: '2rem 1rem',
        }}
      >
        {/* Public Navbar */}
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0 }}>
          <PublicNavbar />
        </Box>
        <Box sx={{ height: 56, position: 'absolute', top: 0 }} />
        <DrokexCard 
          variant="elevated" 
          sx={{ 
            width: '100%', 
            maxWidth: 400,
            overflow: 'visible'
          }}
        >
          <DrokexCardContent>
            {/* Logo y Titulo */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <DrokexLogo variant="full" size="large" color="primary" />
              
              {tenant && (
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mt: 2,
                    mb: 1,
                    color: drokexColors.dark,
                    fontWeight: 400,
                  }}
                >
                  {getCountryFlag()} Iniciar Sesión
                </Typography>
              )}
              
              <Typography 
                variant="body2" 
                sx={{ color: drokexColors.secondary, mb: 2 }}
              >
                Accede a tu cuenta
              </Typography>

              {/* Ocultamos detalles de región/moneda para evitar ruido visual */}
            </Box>

            {/* Formulario */}
            <Box component="form" onSubmit={handleSubmit}>
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 2,
                    backgroundColor: '#ffebee',
                    color: '#d32f2f',
                    '& .MuiAlert-icon': { color: '#d32f2f' }
                  }}
                >
                  {error}
                </Alert>
              )}



              <DrokexInput
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                icon={<Email sx={{ color: drokexColors.secondary }} />}
                sx={{ mb: 2 }}
                disabled={isLoading}
              />

              <DrokexInput
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password}
                helperText={errors.password}
                icon={<Lock sx={{ color: drokexColors.secondary }} />}
                sx={{ mb: 3 }}
                disabled={isLoading}
              />

              <DrokexButton
                type="submit"
                variant="primary"
                fullWidth
                loading={isLoading}
                sx={{ mb: 2 }}
              >
                Iniciar Sesión
              </DrokexButton>

              <Divider sx={{ my: 2 }} />

              {/* Enlaces */}
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  sx={{
                    color: drokexColors.secondary,
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: drokexColors.secondary }}>
                  ¿No tienes una cuenta?{' '}
                  <Link
                    component={RouterLink}
                    to="/register"
                    sx={{
                      color: drokexColors.primary,
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Registrarse
                  </Link>
                </Typography>
              </Box>
            </Box>
          </DrokexCardContent>
        </DrokexCard>

        {/* Footer */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              color: drokexColors.secondary,
              fontSize: '0.7rem',
            }}
          >
            🚀 Drokex - Connecting LATAM Businesses
          </Typography>
        </Box>
      </Box>
    </DrokexPattern>
  );
};

export default Login;

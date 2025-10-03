import React, { useState } from 'react';
import { Box, Container, Grid, Typography, Alert, Link, FormControlLabel, Checkbox } from '@mui/material';
import { DrokexPattern, DrokexCard, DrokexCardContent, DrokexInput, DrokexButton, DrokexLogo } from '../components/common';
import { drokexColors } from '../theme/drokexTheme';
import PublicNavbar from '../components/layout/PublicNavbar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';
import { Email, Person, Lock } from '@mui/icons-material';

const Signup: React.FC = () => {
  const { register, isLoading, error, clearError } = useAuth();
  const { tenant, getCountryFlag } = useTenant();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!firstName.trim()) e.firstName = 'El nombre es requerido';
    if (!lastName.trim()) e.lastName = 'El apellido es requerido';
    if (!email.trim()) e.email = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Ingresa un correo válido';
    if (!password) e.password = 'La contraseña es requerida';
    if (password !== confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    if (!acceptTerms) e.acceptTerms = 'Debes aceptar los términos';
    if (!acceptPrivacy) e.acceptPrivacy = 'Debes aceptar la privacidad';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    clearError();
    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        role: 'Buyer',
        // Nota: el backend asigna TenantId=1 por defecto si no se envía.
        // En multi-tenant, el backend resuelve por header X-Tenant-Subdomain.
        // Si tu endpoint requiere TenantId explícito, se puede extender types + api.
      } as any);
      navigate('/dashboard');
    } catch {
      // manejado por contexto
    }
  };

  return (
    <DrokexPattern pattern="diagonal" opacity={0.03}>
      <Box sx={{ minHeight: '100vh', backgroundColor: drokexColors.light }}>
        <PublicNavbar />
        <Container maxWidth="sm" sx={{ py: 6 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <DrokexLogo variant="full" size="large" color="primary" />
            <Typography variant="h4" sx={{ color: drokexColors.dark, fontWeight: 700, mt: 2 }}>
              {tenant ? `${getCountryFlag()} Registrarme como Comprador` : 'Registrarme como Comprador'}
            </Typography>
            <Typography variant="body2" sx={{ color: drokexColors.secondary, mt: 1 }}>
              Crea tu cuenta para guardar favoritos, seguir proveedores y enviar consultas.
            </Typography>
          </Box>

          <DrokexCard variant="elevated">
            <DrokexCardContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2, backgroundColor: '#ffebee', color: '#d32f2f' }}>{error}</Alert>
              )}
              <Box component="form" onSubmit={onSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <DrokexInput
                      label="Nombre *"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      error={!!errors.firstName}
                      helperText={errors.firstName}
                      icon={<Person />}
                      disabled={isLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DrokexInput
                      label="Apellido *"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      error={!!errors.lastName}
                      helperText={errors.lastName}
                      icon={<Person />}
                      disabled={isLoading}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <DrokexInput
                      label="Correo electrónico *"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={!!errors.email}
                      helperText={errors.email}
                      icon={<Email />}
                      disabled={isLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DrokexInput
                      label="Contraseña *"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={!!errors.password}
                      helperText={errors.password}
                      icon={<Lock />}
                      disabled={isLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DrokexInput
                      label="Confirmar contraseña *"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword}
                      icon={<Lock />}
                      disabled={isLoading}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          sx={{ color: drokexColors.secondary, '&.Mui-checked': { color: drokexColors.primary } }}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          Acepto los{' '}
                          <Link href="#" sx={{ color: drokexColors.primary, textDecoration: 'none' }}>términos y condiciones</Link> de uso
                        </Typography>
                      }
                    />
                    {errors.acceptTerms && (
                      <Typography variant="caption" sx={{ color: '#d32f2f', ml: 4 }}>{errors.acceptTerms}</Typography>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={acceptPrivacy}
                          onChange={(e) => setAcceptPrivacy(e.target.checked)}
                          sx={{ color: drokexColors.secondary, '&.Mui-checked': { color: drokexColors.primary } }}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          Acepto la{' '}
                          <Link href="#" sx={{ color: drokexColors.primary, textDecoration: 'none' }}>política de privacidad</Link>
                        </Typography>
                      }
                    />
                    {errors.acceptPrivacy && (
                      <Typography variant="caption" sx={{ color: '#d32f2f', ml: 4 }}>{errors.acceptPrivacy}</Typography>
                    )}
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                  <Link component={RouterLink} to="/register-choice" sx={{ color: drokexColors.secondary, textDecoration: 'none' }}>
                    ¿Prefieres ser proveedor?
                  </Link>
                  <DrokexButton type="submit" variant="primary" loading={isLoading}>
                    Crear cuenta
                  </DrokexButton>
                </Box>
              </Box>
            </DrokexCardContent>
          </DrokexCard>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" sx={{ color: drokexColors.secondary }}>
              ¿Ya tienes una cuenta?{' '}
              <Link component={RouterLink} to="/login" sx={{ color: drokexColors.primary, textDecoration: 'none', fontWeight: 600 }}>
                Inicia sesión
              </Link>
            </Typography>
          </Box>
        </Container>
      </Box>
    </DrokexPattern>
  );
};

export default Signup;


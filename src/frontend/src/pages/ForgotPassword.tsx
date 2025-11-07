import React, { useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { DrokexPattern, DrokexCard, DrokexCardContent, DrokexInput, DrokexButton, DrokexLogo } from '../components/common';
import PublicFooter from '../components/layout/PublicFooter';
import { drokexColors } from '../theme/drokexTheme';
import apiClient from '../services/api';
import { useNavigate } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setMessage(null);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setMessage('Si el correo existe, te enviaremos un enlace para restablecer la contraseña.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrokexPattern pattern="diagonal" opacity={0.03}>
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: drokexColors.light }}>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          <DrokexCard variant="elevated" sx={{ width: '100%', maxWidth: 420 }}>
          <DrokexCardContent>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <DrokexLogo variant="full" size="large" color="primary" />
              <Typography variant="h5" sx={{ mt: 2, color: drokexColors.dark, fontWeight: 700 }}>Recuperar contraseña</Typography>
              <Typography variant="body2" sx={{ color: drokexColors.secondary }}>Ingresa tu email y te enviaremos un enlace.</Typography>
            </Box>

            {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={submit}>
              <DrokexInput label="Correo electrónico" type="email" value={email} onChange={(e) => setEmail((e.target as any).value)} required />
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <DrokexButton type="submit" variant="primary" loading={loading} fullWidth>Enviar enlace</DrokexButton>
                <DrokexButton type="button" variant="outline" onClick={() => navigate('/login')} fullWidth>Volver</DrokexButton>
              </Box>
            </Box>
          </DrokexCardContent>
          </DrokexCard>
        </Box>
        <PublicFooter />
      </Box>
    </DrokexPattern>
  );
};

export default ForgotPassword;

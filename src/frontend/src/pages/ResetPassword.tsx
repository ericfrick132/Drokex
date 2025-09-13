import React, { useMemo, useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { DrokexPattern, DrokexCard, DrokexCardContent, DrokexInput, DrokexButton, DrokexLogo } from '../components/common';
import { drokexColors } from '../theme/drokexTheme';
import apiClient from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setMessage(null);
    if (!token) { setError('Token inválido'); return; }
    if (!password || password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword: password });
      setMessage('Tu contraseña fue actualizada. Ahora puedes iniciar sesión.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrokexPattern pattern="diagonal" opacity={0.03}>
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: drokexColors.light, p: 2 }}>
        <DrokexCard variant="elevated" sx={{ width: '100%', maxWidth: 420 }}>
          <DrokexCardContent>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <DrokexLogo variant="full" size="large" color="primary" />
              <Typography variant="h5" sx={{ mt: 2, color: drokexColors.dark, fontWeight: 700 }}>Restablecer contraseña</Typography>
              <Typography variant="body2" sx={{ color: drokexColors.secondary }}>Ingresa tu nueva contraseña.</Typography>
            </Box>

            {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={submit}>
              <DrokexInput label="Nueva contraseña" type="password" value={password} onChange={(e) => setPassword((e.target as any).value)} required />
              <Box sx={{ height: 12 }} />
              <DrokexInput label="Confirmar contraseña" type="password" value={confirm} onChange={(e) => setConfirm((e.target as any).value)} required />
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <DrokexButton type="submit" variant="primary" loading={loading} fullWidth>Actualizar</DrokexButton>
                <DrokexButton type="button" variant="outline" onClick={() => navigate('/login')} fullWidth>Cancelar</DrokexButton>
              </Box>
            </Box>
          </DrokexCardContent>
        </DrokexCard>
      </Box>
    </DrokexPattern>
  );
};

export default ResetPassword;


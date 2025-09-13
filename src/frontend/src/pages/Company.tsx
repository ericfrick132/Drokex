import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Chip, Stack, Alert, Skeleton } from '@mui/material';
import { DrokexCard, DrokexCardContent, DrokexCardActions, DrokexInput, DrokexButton } from '../components/common';
import { useAuth } from '../contexts/AuthContext';
import { companiesApi } from '../services/api';
import { Company } from '../types';
import { drokexColors } from '../theme/drokexTheme';
import { useNavigate } from 'react-router-dom';

const CompanyPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasCompany = !!user?.companyId;

  const load = async () => {
    if (!user?.companyId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const { data } = await companiesApi.getCompany(user.companyId);
      if (data.data) setCompany(data.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo cargar la empresa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.companyId]);

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const { data } = await companiesApi.updateCompany(company.id, {
        name: company.name,
        description: company.description,
        contactEmail: company.contactEmail,
        phone: company.phone,
        address: company.address,
        website: company.website,
      });
      if (data.data) {
        setCompany(data.data);
        setSuccess('Empresa actualizada correctamente');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo actualizar la empresa');
    } finally {
      setSaving(false);
    }
  };

  if (!hasCompany) {
    return (
      <Box>
        <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 2.5 }}>Mi Empresa</Typography>
        <DrokexCard>
          <DrokexCardContent sx={{ p: 2.5 }}>
            <Typography variant="body1" sx={{ color: drokexColors.secondary, mb: 2 }}>
              Aún no tienes una empresa asociada a tu usuario.
            </Typography>
            <Typography variant="body2" sx={{ color: drokexColors.secondary }}>
              Regístrate como proveedor o solicita al administrador que te asigne a una empresa.
            </Typography>
          </DrokexCardContent>
        </DrokexCard>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1.5, md: 0 }, mb: { xs: 2.5, md: 4 } }}>
        <Box>
          <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700 }}>Mi Empresa</Typography>
          <Typography variant="body2" sx={{ color: drokexColors.secondary, mt: 0.5 }}>
            Gestiona la información visible para tus clientes
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
          {company && (
            <Chip
              label={company.isApproved ? 'Aprobada' : 'Pendiente de aprobación'}
              color={company.isApproved ? 'primary' : 'default'}
              sx={{ fontWeight: 600, alignSelf: { xs: 'flex-start', sm: 'center' } }}
            />
          )}
          {company && (
            <DrokexButton
              variant="outline"
              size="small"
              onClick={() => navigate(`/catalog?companyId=${company.id}`)}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Ver catálogo público
            </DrokexButton>
          )}
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={8}>
          <DrokexCard>
            <DrokexCardContent sx={{ p: 2.5 }}>
              {loading || !company ? (
                <>
                  <Skeleton variant="text" width="60%" height={36} />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="rectangular" height={140} sx={{ mt: 2, borderRadius: 2 }} />
                </>
              ) : (
                <Stack spacing={2.5}>
                  <DrokexInput
                    label="Nombre de la empresa"
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  />
                  <DrokexInput
                    label="Descripción"
                    multiline
                    minRows={3}
                    value={company.description}
                    onChange={(e) => setCompany({ ...company, description: e.target.value })}
                  />
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <DrokexInput
                        label="Correo de contacto"
                        type="email"
                        value={company.contactEmail}
                        onChange={(e) => setCompany({ ...company, contactEmail: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DrokexInput
                        label="Teléfono"
                        value={company.phone}
                        onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <DrokexInput
                        label="Dirección"
                        value={company.address}
                        onChange={(e) => setCompany({ ...company, address: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <DrokexInput
                        label="Sitio web"
                        value={company.website}
                        onChange={(e) => setCompany({ ...company, website: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </Stack>
              )}
            </DrokexCardContent>
            <DrokexCardActions sx={{ px: 2.5, py: 1.5 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ width: '100%', justifyContent: 'flex-end' }}>
                <DrokexButton
                  variant="outline"
                  onClick={load}
                  disabled={loading || saving}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Cancelar
                </DrokexButton>
                <DrokexButton
                  variant="primary"
                  onClick={handleSave}
                  loading={saving}
                  disabled={loading}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Guardar cambios
                </DrokexButton>
              </Stack>
            </DrokexCardActions>
          </DrokexCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <DrokexCard variant="elevated">
            <DrokexCardContent sx={{ p: 2.5 }}>
              {loading || !company ? (
                <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
              ) : (
                <Stack spacing={2.25}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: drokexColors.dark }}>
                    Estado y estadísticas
                  </Typography>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Chip size="small" label={company.isApproved ? 'Aprobada' : 'Pendiente'} color={company.isApproved ? 'primary' : 'default'} />
                    <Chip size="small" label={company.isActive ? 'Activa' : 'Inactiva'} />
                  </Stack>
                  <Stack direction="row" spacing={2.5}>
                    <Box>
                      <Typography variant="caption" sx={{ color: drokexColors.secondary }}>Productos</Typography>
                      <Typography variant="h6" sx={{ m: 0 }}>{company.productsCount}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: drokexColors.secondary }}>Usuarios</Typography>
                      <Typography variant="h6" sx={{ m: 0 }}>{company.usersCount}</Typography>
                    </Box>
                  </Stack>
                  <Typography variant="caption" sx={{ color: drokexColors.secondary }}>
                    Creada: {new Date(company.createdAt).toLocaleDateString()}
                  </Typography>
                </Stack>
              )}
            </DrokexCardContent>
          </DrokexCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CompanyPage;

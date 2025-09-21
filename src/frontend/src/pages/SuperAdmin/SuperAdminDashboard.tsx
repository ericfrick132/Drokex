import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Skeleton,
  Button,
  Link
} from '@mui/material';
import { DrokexPattern, DrokexCard, DrokexCardContent, DrokexButton } from '../../components/common';
import { drokexColors } from '../../theme/drokexTheme';
import { Logout, Refresh, Domain, Groups, CloudQueue, Security } from '@mui/icons-material';
import superadminApi from '../../services/superadminApi';

type SuperAdmin = {
  id: number;
  name?: string;
  email: string;
};

type Analytics = any;

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const superAdmin: SuperAdmin | null = useMemo(() => {
    try {
      const raw = localStorage.getItem('superadmin_data');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // Guard: require superadmin token
  useEffect(() => {
    const token = localStorage.getItem('superadmin_token');
    if (!token) {
      navigate('/superadmin/login', { replace: true });
      return;
    }

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await superadminApi.getAnalytics();
        setAnalytics(res.data?.data ?? null);
      } catch {
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('superadmin_refresh');
    localStorage.removeItem('superadmin_data');
    navigate('/superadmin/login', { replace: true });
  };

  const StatCard = ({
    icon,
    label,
    value,
    loading,
  }: { icon: React.ReactNode; label: string; value: string | number; loading?: boolean }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: drokexColors.light, color: drokexColors.secondary }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            {loading ? (
              <Skeleton width={80} height={28} />
            ) : (
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {value}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <DrokexPattern pattern="gradient" opacity={0.04}>
      <Box sx={{ minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Security sx={{ color: drokexColors.secondary }} />
                <Typography variant="overline" sx={{ color: drokexColors.secondary, fontWeight: 700 }}>
                  Super Admin
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Panel de Control
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {superAdmin?.name || superAdmin?.email || 'Usuario'}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Tooltip title="Refrescar estadísticas">
                <span>
                  <IconButton
                    onClick={() => {
                      // trigger re-fetch by re-running effect
                      // simplest approach: just reload for now
                      window.location.reload();
                    }}
                    color="primary"
                  >
                    <Refresh />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Cerrar sesión">
                <IconButton color="inherit" onClick={handleLogout}>
                  <Logout />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Quick stats */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<Domain />} label="Empresas Totales" value={analytics?.summary?.totalTenants ?? 0} loading={loading} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<CloudQueue />} label="Empresas Activas" value={analytics?.summary?.activeTenants ?? 0} loading={loading} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<Groups />} label="Usuarios Totales" value={analytics?.summary?.totalUsers ?? 0} loading={loading} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<CloudQueue />} label="Productos Totales" value={analytics?.summary?.totalProducts ?? 0} loading={loading} />
            </Grid>
          </Grid>

          {/* Management blocks */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <DrokexCard>
                <CardHeader
                  title={<Typography variant="h6">Empresas</Typography>}
                  subheader="Gestión centralizada de marketplaces"
                />
                <Divider />
                <DrokexCardContent>
                  {loading ? (
                    <>
                      <Skeleton height={32} />
                      <Skeleton height={52} />
                      <Skeleton height={52} />
                      <Skeleton height={52} />
                    </>
                  ) : (
                    <>
                      <Grid container spacing={1}>
                        {(analytics?.recentActivity ?? []).slice(0, 5).map((a: any, idx: number) => (
                          <Grid key={idx} item xs={12}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.tenantName}</Typography>
                              <Typography variant="caption" color="text.secondary">{new Date(a.createdAt).toLocaleDateString()}</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                      <Box mt={2} display="flex" gap={2}>
                        <Button variant="contained" component={RouterLink} to="/superadmin/tenants">Ver Empresas</Button>
                        <Button variant="outlined" component={RouterLink} to="/superadmin/tenants?create=1">Crear Empresa</Button>
                      </Box>
                    </>
                  )}
                </DrokexCardContent>
              </DrokexCard>
            </Grid>
            <Grid item xs={12} md={5}>
              <DrokexCard>
                <CardHeader
                  title={<Typography variant="h6">Acciones Rápidas</Typography>}
                  subheader="Mantenimiento y seguridad"
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Link component={RouterLink} to="/superadmin/users" underline="none">
                        <DrokexButton variant="secondary" fullWidth>
                          Ver Usuarios
                        </DrokexButton>
                      </Link>
                    </Grid>
                    <Grid item xs={12}>
                      <Link component={RouterLink} to="/superadmin/tenants" underline="none">
                        <DrokexButton variant="secondary" fullWidth>
                          Gestionar Empresas
                        </DrokexButton>
                      </Link>
                    </Grid>
                    <Grid item xs={12}>
                      <DrokexButton variant="secondary" fullWidth onClick={() => window.location.reload()}>
                        Refrescar Datos
                      </DrokexButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </DrokexCard>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </DrokexPattern>
  );
};

export default SuperAdminDashboard;

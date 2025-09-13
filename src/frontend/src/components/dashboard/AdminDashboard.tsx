import React, { useEffect, useMemo, useState } from 'react';
import { Grid, Typography, Box } from '@mui/material';
import {
  Business,
  Inventory,
  People,
  PendingActions,
  CheckCircle,
  Warning,
  Assessment,
  Settings,
  Category,
  Report
} from '@mui/icons-material';
import StatCard from './StatCard';
import ActivityList, { Activity } from './ActivityList';
import QuickActionCard, { QuickAction } from './QuickActionCard';
import { drokexColors } from '../../theme/drokexTheme';
import { useNavigate } from 'react-router-dom';
import { tenantsApi, leadsApi, companiesApi, productsApi } from '../../services/api';
import { useTenant } from '../../contexts/TenantContext';
import { Email, ShoppingCart } from '@mui/icons-material';

type Stats = {
  totalCompanies: number;
  activeCompanies: number;
  totalProducts: number;
  activeProducts: number;
  totalUsers: number;
  pendingApprovals: number;
  lastActivity?: string;
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await tenantsApi.getStatistics();
        if (data.success && data.data) {
          setStats({
            totalCompanies: data.data.totalCompanies ?? 0,
            activeCompanies: data.data.activeCompanies ?? 0,
            totalProducts: data.data.totalProducts ?? 0,
            activeProducts: data.data.activeProducts ?? 0,
            totalUsers: data.data.totalUsers ?? 0,
            pendingApprovals: data.data.pendingApprovals ?? 0,
            lastActivity: data.data.lastActivity,
          });
        } else {
          setError(data.message || 'No se pudieron cargar estadísticas');
        }

        // Load activities (recent leads, companies, products)
        const [leadsResp, pendingCompaniesResp, approvedCompaniesResp, productsResp] = await Promise.all([
          leadsApi.getLeads(1, 5),
          companiesApi.getCompanies(1, 5, undefined, false),
          companiesApi.getCompanies(1, 5, undefined, true),
          productsApi.getProducts({ page: 1, pageSize: 5, sortBy: 'CreatedAt', sortOrder: 'desc' } as any),
        ]);

        const leadActs: Activity[] = (leadsResp.data.data?.data || []).map((l: any) => ({
          id: `lead-${l.id}`,
          title: 'Nueva consulta de comprador',
          description: `${l.contactName} de ${l.companyName} (${l.email})`,
          timestamp: l.createdAt,
          type: 'lead',
          status: l.isContacted ? 'completed' : 'new',
          icon: <Email />,
        }));

        const pendingActs: Activity[] = (pendingCompaniesResp.data.data?.data || []).map((c: any) => ({
          id: `company-pending-${c.id}`,
          title: 'Nueva empresa registrada',
          description: `${c.name} solicitó aprobación`,
          timestamp: c.createdAt,
          type: 'company',
          status: 'pending',
          icon: <Business />,
        }));

        // Only recently approved companies (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
        const approvedActs: Activity[] = (approvedCompaniesResp.data.data?.data || [])
          .filter((c: any) => c.approvedAt && c.approvedAt >= sevenDaysAgo)
          .map((c: any) => ({
            id: `company-approved-${c.id}`,
            title: 'Empresa aprobada',
            description: `${c.name} ya puede publicar productos`,
            timestamp: c.approvedAt,
            type: 'company',
            status: 'completed',
            icon: <CheckCircle />,
          }));

        const prods: any[] = productsResp.data.data?.data || [];
        const productActs: Activity[] = prods.map((p: any) => ({
          id: `product-${p.id}`,
          title: `Nuevo producto: ${p.name}`,
          description: p.companyName,
          timestamp: p.createdAt,
          type: 'product',
          status: 'new',
          icon: <Inventory />,
        }));

        // Stock bajo (simple): marcar productos con stock <= 30
        const lowStockActs: Activity[] = prods
          .filter((p: any) => (p.stock ?? 0) <= 30)
          .map((p: any) => ({
            id: `stock-${p.id}`,
            title: 'Stock bajo',
            description: `${p.name} - Solo quedan ${p.stock ?? 0} unidades`,
            timestamp: p.updatedAt || p.createdAt,
            type: 'product',
            status: 'urgent',
            icon: <Warning />,
          }));

        // Perfil actualizado: companies aprobadas con UpdatedAt reciente (> CreatedAt)
        const updatedActs: Activity[] = (approvedCompaniesResp.data.data?.data || [])
          .filter((c: any) => c.updatedAt && new Date(c.updatedAt).getTime() > new Date(c.createdAt).getTime())
          .map((c: any) => ({
            id: `company-updated-${c.id}`,
            title: 'Perfil actualizado',
            description: `${c.name} actualizó su información de empresa`,
            timestamp: c.updatedAt,
            type: 'company',
            status: 'completed',
            icon: <CheckCircle />,
          }));

        // Producto más visto (hoy)
        let mostViewedActs: Activity[] = [];
        try {
          const mv = await (await import('../../services/api')).catalogApi.getFeaturedProducts?.(1); // placeholder avoid TS
        } catch {}
        try {
          const res = await (await import('../../services/api')).default.get('/catalog/products/most-viewed');
          const mv = res.data?.data;
          if (mv) {
            mostViewedActs = [{
              id: `most-${mv.id}`,
              title: 'Producto más visto',
              description: `${mv.name} ha sido visto ${mv.views} veces hoy`,
              timestamp: new Date().toISOString(),
              type: 'product',
              status: 'completed',
              icon: <Inventory />,
            }];
          }
        } catch {}

        const all = [...leadActs, ...pendingActs, ...approvedActs, ...productActs, ...lowStockActs, ...updatedActs, ...mostViewedActs]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(all);
      } catch (e: any) {
        setError(e.message || 'Error de conexión');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = useMemo(() => {
    return [
      {
        title: 'Empresas Registradas',
        value: stats?.totalCompanies ?? 0,
        subtitle: stats ? `${stats.activeCompanies} activas, ${stats.pendingApprovals} pendientes` : '—',
        icon: <Business />,
        color: 'primary' as const,
        trend: undefined,
      },
      {
        title: 'Total de Productos',
        value: stats?.totalProducts ?? 0,
        subtitle: stats ? `${stats.activeProducts} activos` : '—',
        icon: <Inventory />,
        color: 'info' as const,
        trend: undefined,
      },
      {
        title: 'Usuarios',
        value: stats?.totalUsers ?? 0,
        subtitle: 'usuarios totales',
        icon: <People />,
        color: 'success' as const,
        trend: undefined,
      },
      {
        title: 'Pendientes Revisión',
        value: stats?.pendingApprovals ?? 0,
        subtitle: 'Empresas por aprobar',
        icon: <PendingActions />,
        color: 'warning' as const,
        trend: undefined,
      },
    ];
  }, [stats]);

  // Actividades se cargan desde backend en useEffect

  // Acciones administrativas
  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Aprobar Empresas',
      description: 'Revisa y aprueba empresas pendientes de verificación',
      icon: <CheckCircle />,
      color: 'success',
      onClick: () => navigate('/admin/companies/pending')
    },
    {
      id: '2',
      title: 'Gestionar Categorías',
      description: 'Añade, edita o reorganiza categorías de productos',
      icon: <Category />,
      color: 'primary',
      onClick: () => navigate('/admin/categories')
    },
    {
      id: '3',
      title: 'Ver Reportes',
      description: 'Accede a reportes detallados y analíticas',
      icon: <Assessment />,
      color: 'info',
      onClick: () => navigate('/admin/reports')
    },
    {
      id: '4',
      title: 'Configuración',
      description: 'Configura parámetros del marketplace y tenant',
      icon: <Settings />,
      color: 'secondary',
      onClick: () => navigate('/admin/settings')
    }
  ];

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography
          variant="h4"
          sx={{
            color: drokexColors.dark,
            fontWeight: 700,
            mb: 0.5
          }}
        >
          {tenant?.name ? `${tenant.name}` : 'Panel de Administración'}
        </Typography>
        {tenant?.name && (
          <Typography variant="subtitle1" sx={{ color: drokexColors.secondary }}>
            Panel de Administración
          </Typography>
        )}
        <Typography
          variant="body1"
          sx={{
            color: drokexColors.secondary,
            fontWeight: 400
          }}
        >
          Gestiona y supervisa el marketplace. Aquí puedes aprobar empresas, revisar reportes y configurar el sistema.
        </Typography>
      </Box>

      {/* Estadísticas del sistema */}
      <Grid container spacing={3} mb={4}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend}
            />
          </Grid>
        ))}
      </Grid>

      {loading && (
        <Box sx={{ color: drokexColors.secondary, mb: 3 }}>Cargando estadísticas...</Box>
      )}
      {error && (
        <Box sx={{ color: '#d32f2f', mb: 3 }}>Error: {error}</Box>
      )}

      {/* Contenido principal */}
      <Grid container spacing={3}>
        {/* Actividades del sistema */}
        <Grid item xs={12} md={8}>
          <ActivityList
            title="Actividad del Sistema"
            activities={activities}
            maxItems={8}
          />
        </Grid>

        {/* Acciones administrativas */}
        <Grid item xs={12} md={4}>
          <Typography
            variant="h6"
            sx={{
              color: drokexColors.dark,
              fontWeight: 600,
              mb: 2
            }}
          >
            Gestión Administrativa
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action) => (
              <Grid item xs={12} key={action.id}>
                <QuickActionCard action={action} />
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Sección adicional de alertas importantes */}
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12}>
          <Box
            sx={{
              background: `linear-gradient(135deg, ${drokexColors.primary}20 0%, ${drokexColors.secondary}20 100%)`,
              border: `1px solid ${drokexColors.primary}40`,
              borderRadius: 3,
              p: 3
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: drokexColors.dark,
                fontWeight: 600,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <PendingActions sx={{ color: drokexColors.secondary }} />
              Tareas Pendientes Importantes
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    bgcolor: '#fff',
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #ffa726',
                    borderLeft: '4px solid #ff9800'
                  }}
                >
                  <Typography variant="body2" color="#ff9800" fontWeight={600}>
                    2 Empresas Pendientes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Requieren aprobación para activar cuentas
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    bgcolor: '#fff',
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #ef5350',
                    borderLeft: '4px solid #f44336'
                  }}
                >
                  <Typography variant="body2" color="#f44336" fontWeight={600}>
                    1 Reporte Urgente
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Problema reportado por usuario necesita atención
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    bgcolor: '#fff',
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${drokexColors.primary}`,
                    borderLeft: `4px solid ${drokexColors.primary}`
                  }}
                >
                  <Typography variant="body2" color={drokexColors.secondary} fontWeight={600}>
                    Backup Programado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Backup automático se ejecutará en 2 horas
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;

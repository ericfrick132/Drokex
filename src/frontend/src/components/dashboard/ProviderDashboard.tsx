import React, { useEffect, useMemo, useState } from 'react';
import { Grid, Typography, Box } from '@mui/material';
import {
  Inventory,
  TrendingUp,
  ContactMail,
  AttachMoney,
  Add,
  Visibility,
  Business,
  Settings
} from '@mui/icons-material';
import StatCard from './StatCard';
import ActivityList, { Activity } from './ActivityList';
import QuickActionCard, { QuickAction } from './QuickActionCard';
import { drokexColors } from '../../theme/drokexTheme';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { leadsApi, activitiesApi } from '../../services/api';

const ProviderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tenant, formatCurrency } = useTenant();
  const [leadsTotal, setLeadsTotal] = useState<number | null>(null);
  const [loadingLeads, setLoadingLeads] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadLeadsCount = async () => {
      try {
        setLoadingLeads(true);
        // Pedimos 1 elemento solo para obtener totalRecords
        const { data } = await leadsApi.getLeads(1, 1);
        if (!cancelled) {
          // data.data is optional in ApiResponse; guard accordingly
          setLeadsTotal(data.data?.totalRecords ?? null);
        }
      } catch (e) {
        if (!cancelled) setLeadsTotal(null);
      } finally {
        if (!cancelled) setLoadingLeads(false);
      }
    };
    loadLeadsCount();
    return () => { cancelled = true; };
  }, []);

  // Estadísticas dinámicas (sin hardcode)
  const stats = useMemo(() => {
    const totalProducts = tenant?.statistics?.totalProducts ?? 0;
    const activeProducts = tenant?.statistics?.activeProducts ?? 0;
    const inactiveProducts = Math.max(totalProducts - activeProducts, 0);
    const monthlyRevenue = tenant?.statistics?.monthlyRevenue ?? 0;

    return [
      {
        title: 'Productos Publicados',
        value: totalProducts,
        subtitle: totalProducts > 0 ? `${activeProducts} activos, ${inactiveProducts} inactivos` : undefined,
        icon: <Inventory />,
        color: 'primary' as const,
        trend: undefined as any
      },
      {
        title: 'Leads Recibidos',
        value: loadingLeads ? '…' : (leadsTotal ?? '—'),
        subtitle: undefined,
        icon: <ContactMail />,
        color: 'secondary' as const,
        trend: undefined as any
      },
      {
        title: 'Productos Vistos',
        value: '—',
        subtitle: undefined,
        icon: <Visibility />,
        color: 'info' as const,
        trend: undefined as any
      },
      {
        title: 'Revenue Estimado',
        value: monthlyRevenue > 0 ? formatCurrency(monthlyRevenue) : '—',
        subtitle: undefined,
        icon: <AttachMoney />,
        color: 'success' as const,
        trend: undefined as any
      }
    ];
  }, [tenant, leadsTotal, loadingLeads, formatCurrency]);

  // Actividades recientes desde backend
  const [activities, setActivities] = useState<Activity[]>([]);
  useEffect(() => {
    let cancelled = false;
    const loadActivities = async () => {
      try {
        const { data } = await activitiesApi.getRecent(8);
        const list = data.data ?? [];
        const mapStatus = (s: string): Activity['status'] => {
          const v = s?.toLowerCase?.() || '';
          return (['new','pending','completed','urgent'].includes(v) ? v : 'new') as Activity['status'];
        };
        const inferType = (title: string): Activity['type'] => {
          const t = title.toLowerCase();
          if (t.includes('lead') || t.includes('consulta') || t.includes('cotización')) return 'lead';
          if (t.includes('producto') || t.includes('stock') || t.includes('vista')) return 'product';
          if (t.includes('perfil') || t.includes('empresa')) return 'company';
          return 'product';
        };
        const mapped: Activity[] = list.map((a: any) => ({
          id: String(a.id),
          title: a.title,
          description: a.description,
          timestamp: new Date(a.createdAt || Date.now()).toISOString(),
          type: inferType(a.title || ''),
          status: mapStatus(a.status || ''),
        }));
        if (!cancelled) setActivities(mapped);
      } catch {
        if (!cancelled) setActivities([]);
      }
    };
    loadActivities();
    return () => { cancelled = true; };
  }, []);

  // Acciones rápidas
  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Añadir Producto',
      description: 'Publica un nuevo producto en el marketplace',
      icon: <Add />,
      color: 'primary',
      onClick: () => navigate('/products/new')
    },
    {
      id: '2',
      title: 'Ver Leads',
      description: 'Revisa las consultas de compradores interesados',
      icon: <ContactMail />,
      color: 'secondary',
      onClick: () => navigate('/leads')
    },
    {
      id: '3',
      title: 'Gestionar Inventario',
      description: 'Actualiza stock y precios de tus productos',
      icon: <Inventory />,
      color: 'info',
      onClick: () => navigate('/products')
    },
    {
      id: '4',
      title: 'Mi Empresa',
      description: 'Actualiza información y configuración',
      icon: <Business />,
      color: 'success',
      onClick: () => navigate('/company')
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
          {tenant?.name ? `${tenant.name}` : 'Dashboard del Proveedor'}
        </Typography>
        {tenant?.name && (
          <Typography variant="subtitle1" sx={{ color: drokexColors.secondary, mb: 1 }}>
            Dashboard del Proveedor
          </Typography>
        )}
        <Typography
          variant="body1"
          sx={{
            color: drokexColors.secondary,
            fontWeight: 400
          }}
        >
          Bienvenido a tu panel de control. Aquí puedes gestionar tus productos y revisar el rendimiento de tu empresa.
        </Typography>
      </Box>

      {/* Estadísticas */}
      <Box sx={{ position: 'relative', mb: 4 }}>
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
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

        {/* Robot Señalador superpuesto debajo del card Revenue Estimado */}
        <Box sx={{
          position: 'absolute',
          top: '100%',
          right: { xs: '10px', md: '-4rem' },
          width: { xs: '200px', md: '300px' },
          height: { xs: '200px', md: '500px' },
          backgroundImage: 'url(/assets/robot-senalador.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center bottom',
          zIndex: 10,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.15))',
          transform: 'translateY(-20px)',
          opacity: 0.9,
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(to top, rgba(255, 255, 255, 0.5) 20%, rgba(255, 255, 255, 0.5) 70%, transparent 100%)',
            pointerEvents: 'none'
          }
        }} />
      </Box>

      {/* Contenido principal */}
      <Grid container spacing={3}>
        {/* Actividades recientes */}
        <Grid item xs={12} md={8}>
          <ActivityList title="Actividad Reciente" activities={activities} maxItems={8} />
        </Grid>

        {/* Acciones rápidas */}
        <Grid item xs={12} md={4}>
          <Typography
            variant="h6"
            sx={{
              color: drokexColors.dark,
              fontWeight: 600,
              mb: 2
            }}
          >
            Acciones Rápidas
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
    </Box>
  );
};

export default ProviderDashboard;

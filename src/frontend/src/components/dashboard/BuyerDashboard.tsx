import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import {
  Favorite,
  History,
  Business,
  LocalOffer,
  Search,
  ShoppingCart,
  TrendingUp,
  Explore
} from '@mui/icons-material';
import StatCard from './StatCard';
import ActivityList, { Activity } from './ActivityList';
import QuickActionCard, { QuickAction } from './QuickActionCard';
import { drokexColors } from '../../theme/drokexTheme';
import { useTenant } from '../../contexts/TenantContext';
import { useNavigate } from 'react-router-dom';

const BuyerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();

  // Mock data para estadísticas del comprador
  const stats = [
    {
      title: 'Productos Guardados',
      value: 24,
      subtitle: '8 nuevos esta semana',
      icon: <Favorite />,
      color: 'primary' as const,
      trend: { value: 25.0, isPositive: true }
    },
    {
      title: 'Proveedores Seguidos',
      value: 12,
      subtitle: 'En diferentes categorías',
      icon: <Business />,
      color: 'secondary' as const,
      trend: { value: 8.3, isPositive: true }
    },
    {
      title: 'Búsquedas Realizadas',
      value: 89,
      subtitle: 'Este mes',
      icon: <Search />,
      color: 'info' as const,
      trend: { value: 15.7, isPositive: true }
    },
    {
      title: 'Ofertas Disponibles',
      value: 16,
      subtitle: 'En productos de interés',
      icon: <LocalOffer />,
      color: 'success' as const,
      trend: { value: 12.1, isPositive: true }
    }
  ];

  // Mock data para actividades del comprador
  const activities: Activity[] = [
    {
      id: '1',
      title: 'Nueva oferta disponible',
      description: 'Café Arábica Premium - Descuento del 15% por volumen',
      timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
      type: 'order',
      status: 'new',
      icon: <LocalOffer />
    },
    {
      id: '2',
      title: 'Proveedor actualizado',
      description: 'Café Monte Verde añadió 3 nuevos productos orgánicos',
      timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
      type: 'company',
      status: 'completed',
      icon: <Business />
    },
    {
      id: '3',
      title: 'Producto agregado a favoritos',
      description: 'Guardaste "Miel Pura de Flores Silvestres" en favoritos',
      timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
      type: 'product',
      status: 'completed',
      icon: <Favorite />
    },
    {
      id: '4',
      title: 'Búsqueda popular',
      description: 'Tu búsqueda "café orgánico" coincide con 23 productos nuevos',
      timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
      type: 'product',
      status: 'completed',
      icon: <TrendingUp />
    },
    {
      id: '5',
      title: 'Nueva empresa verificada',
      description: 'Textiles Maya Guatemala ahora está verificada y disponible',
      timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
      type: 'company',
      status: 'completed',
      icon: <Business />
    },
    {
      id: '6',
      title: 'Consulta enviada',
      description: 'Enviaste consulta de precio a Aguacates Michoacán',
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      type: 'lead',
      status: 'pending',
      icon: <ShoppingCart />
    }
  ];

  // Acciones rápidas para compradores
  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Explorar Catálogo',
      description: 'Descubre productos de proveedores verificados',
      icon: <Explore />,
      color: 'primary',
      onClick: () => navigate('/catalog')
    },
    {
      id: '2',
      title: 'Mis Favoritos',
      description: 'Ve los productos que has guardado',
      icon: <Favorite />,
      color: 'secondary',
      onClick: () => navigate('/favorites')
    },
    {
      id: '3',
      title: 'Proveedores Seguidos',
      description: 'Gestiona las empresas que sigues',
      icon: <Business />,
      color: 'info',
      onClick: () => navigate('/following')
    },
    {
      id: '4',
      title: 'Historial',
      description: 'Revisa tus búsquedas y consultas anteriores',
      icon: <History />,
      color: 'success',
      onClick: () => navigate('/history')
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
          {tenant?.name || 'Mi Dashboard de Comprador'}
        </Typography>
        {tenant?.name && (
          <Typography variant="subtitle1" sx={{ color: drokexColors.secondary }}>
            Mi Dashboard de Comprador
          </Typography>
        )}
        <Typography
          variant="body1"
          sx={{
            color: drokexColors.secondary,
            fontWeight: 400
          }}
        >
          Descubre productos únicos de proveedores verificados en LATAM. Gestiona tus favoritos y encuentra las mejores oportunidades de negocio.
        </Typography>
      </Box>

      {/* Estadísticas del comprador */}
      <Grid container spacing={3} mb={4}>
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

      {/* Contenido principal */}
      <Grid container spacing={3}>
        {/* Actividades recientes */}
        <Grid item xs={12} md={8}>
          <ActivityList
            title="Actividad Reciente"
            activities={activities}
            maxItems={8}
          />
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

      {/* Sección de recomendaciones */}
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12}>
          <Box
            sx={{
              background: `linear-gradient(135deg, ${drokexColors.primary}15 0%, ${drokexColors.secondary}15 100%)`,
              border: `1px solid ${drokexColors.primary}30`,
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
              <TrendingUp sx={{ color: drokexColors.secondary }} />
              Recomendaciones Personalizadas
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    bgcolor: '#fff',
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${drokexColors.primary}30`,
                    borderLeft: `4px solid ${drokexColors.primary}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${drokexColors.primary}20`
                    }
                  }}
                  onClick={() => navigate('/catalog?category=cafe')}
                >
                  <Typography variant="body2" color={drokexColors.secondary} fontWeight={600}>
                    🔥 Productos Destacados
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    15 cafés premium de productores verificados
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    bgcolor: '#fff',
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${drokexColors.secondary}30`,
                    borderLeft: `4px solid ${drokexColors.secondary}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${drokexColors.secondary}20`
                    }
                  }}
                  onClick={() => navigate('/companies/new')}
                >
                  <Typography variant="body2" color={drokexColors.secondary} fontWeight={600}>
                    🆕 Nuevas Empresas
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    3 proveedores se unieron esta semana
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    bgcolor: '#fff',
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid #4caf50',
                    borderLeft: '4px solid #4caf50',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)'
                    }
                  }}
                  onClick={() => navigate('/offers')}
                >
                  <Typography variant="body2" color="#4caf50" fontWeight={600}>
                    💰 Ofertas Especiales
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    Descuentos por volumen en productos seleccionados
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

export default BuyerDashboard;

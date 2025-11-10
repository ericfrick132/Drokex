import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTenant } from './contexts/TenantContext';
import { Box, CircularProgress, Typography } from '@mui/material';
import { drokexColors } from './theme/drokexTheme';

// Componentes de routing
import ProtectedRoute from './components/routing/ProtectedRoute';
import PublicRoute from './components/routing/PublicRoute';

// Layout
import AppLayout from './components/layout/AppLayout';

// Páginas
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import About from './pages/About';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Companies from './pages/Companies';
import CompanyPublic from './pages/CompanyPublic';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import AdminCompaniesPending from './pages/AdminCompaniesPending';
import AdminCategories from './pages/AdminCategories';
import AdminUsers from './pages/AdminUsers';
import Register from './pages/Register';
import RegisterChoice from './pages/RegisterChoice';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import AdminLandingCMS from './pages/AdminLandingCMS';
import CompanyPage from './pages/Company';

// Super Admin
import SuperAdminLogin from './pages/SuperAdmin/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard';
import SuperAdminRoute from './components/routing/SuperAdminRoute';
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import TenantsList from './pages/SuperAdmin/TenantsList';
import TenantDetail from './pages/SuperAdmin/TenantDetail';
import UsersList from './pages/SuperAdmin/UsersList';
import LandingCMS from './pages/SuperAdmin/LandingCMS';
import BusinessTypes from './pages/SuperAdmin/BusinessTypes';
import TenantCategories from './pages/SuperAdmin/TenantCategories';
import CitiesManager from './pages/SuperAdmin/CitiesManager';
import GlobalCategories from './pages/SuperAdmin/GlobalCategories';
import TenantSupportedCountries from './pages/SuperAdmin/TenantSupportedCountries';
// import Products from './pages/Products';
// import Company from './pages/Company';
// import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
// import NotFound from './pages/NotFound';
// import Unauthorized from './pages/Unauthorized';

// Componentes temporales
const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      p: 3,
    }}
  >
    <Typography 
      variant="h4" 
      sx={{ 
        mb: 2, 
        color: drokexColors.dark,
        fontWeight: 600,
      }}
    >
      {title}
    </Typography>
    <Typography 
      variant="body1" 
      sx={{ 
        color: drokexColors.secondary,
        mb: 3,
      }}
    >
      Esta página está en desarrollo y estará disponible pronto.
    </Typography>
    <Box
      sx={{
        backgroundColor: drokexColors.pale,
        color: drokexColors.dark,
        px: 3,
        py: 1,
        borderRadius: 2,
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      🚀 Coming Soon
    </Box>
  </Box>
);

const MainRoutesInner: React.FC = () => (
  <Routes>
      {/* Rutas públicas */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />
      
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/register-choice"
        element={
          <PublicRoute>
            <RegisterChoice />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      <Route path="/catalog" element={<Catalog />} />
      <Route path="/catalog/:id" element={<ProductDetail />} />
      <Route path="/companies" element={<Companies />} />
      <Route path="/companies/:id" element={<CompanyPublic />} />
      <Route path="/about" element={<About />} />

      {/* Rutas protegidas con layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/products" element={
        <ProtectedRoute requireCompany>
          <AppLayout>
            <Products />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/products/new" element={
        <ProtectedRoute requireCompany>
          <AppLayout>
            <ProductForm />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/products/:id/edit" element={
        <ProtectedRoute requireCompany>
          <AppLayout>
            <ProductForm />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route
        path="/company"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CompanyPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/setup"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ComingSoon title="Configurar Empresa" />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Rutas de administrador */}
      <Route path="/admin" element={
        <ProtectedRoute requireRole={['Admin', 'SuperAdmin']}>
          <AppLayout>
            <AdminDashboard />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/companies/pending" element={
        <ProtectedRoute requireRole={['Admin', 'SuperAdmin']}>
          <AppLayout>
            <AdminCompaniesPending />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/categories" element={
        <ProtectedRoute requireRole={['Admin', 'SuperAdmin']}>
          <AppLayout>
            <AdminCategories />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute requireRole={['Admin', 'SuperAdmin']}>
          <AppLayout>
            <AdminUsers />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/landing-cms" element={
        <ProtectedRoute requireRole={['Admin', 'SuperAdmin']}>
          <AppLayout>
            <AdminLandingCMS />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Páginas de error */}
      <Route
        path="/unauthorized"
        element={
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              backgroundColor: drokexColors.light,
              textAlign: 'center',
              p: 3,
            }}
          >
            <Typography 
              variant="h3" 
              sx={{ 
                mb: 2, 
                color: drokexColors.dark,
                fontWeight: 700,
              }}
            >
              401
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 2, 
                color: drokexColors.secondary,
                fontWeight: 600,
              }}
            >
              No Autorizado
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: drokexColors.secondary,
                mb: 3,
              }}
            >
              No tienes permisos para acceder a esta página.
            </Typography>
          </Box>
        }
      />

      {/* 404 - Página no encontrada */}
      <Route
        path="*"
        element={
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              backgroundColor: drokexColors.light,
              textAlign: 'center',
              p: 3,
            }}
          >
            <Typography 
              variant="h3" 
              sx={{ 
                mb: 2, 
                color: drokexColors.dark,
                fontWeight: 700,
              }}
            >
              404
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 2, 
                color: drokexColors.secondary,
                fontWeight: 600,
              }}
            >
              Página no encontrada
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: drokexColors.secondary,
                mb: 3,
              }}
            >
              La página que buscas no existe o ha sido movida.
            </Typography>
          </Box>
        }
      />
  </Routes>
);

const MainWrapper: React.FC = () => {
  const { tenant, isLoading, error } = useTenant();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: drokexColors.light, gap: 2 }}>
        <CircularProgress sx={{ color: drokexColors.primary }} size={40} />
        <Typography variant="body2" sx={{ color: drokexColors.secondary }}>Cargando marketplace...</Typography>
      </Box>
    );
  }

  if (error && !tenant) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: drokexColors.light, padding: '2rem' }}>
        <Box sx={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px' }}>
          <Typography variant="h5" sx={{ color: drokexColors.dark, marginBottom: '1rem', fontWeight: 600 }}>Error de Conexión</Typography>
          <Typography variant="body1" sx={{ color: drokexColors.secondary, marginBottom: '1.5rem' }}>{error}</Typography>
          <Box component="button" onClick={() => window.location.reload()} sx={{ backgroundColor: drokexColors.primary, color: drokexColors.dark, padding: '0.75rem 1.5rem', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', '&:hover': { backgroundColor: drokexColors.secondary, color: 'white' } }}>
            Reintentar
          </Box>
        </Box>
      </Box>
    );
  }

  return <MainRoutesInner />;
};

const SuperAdminRoutes: React.FC = () => (
  <Routes>
    <Route index element={<Navigate to="login" replace />} />
    <Route path="login" element={<SuperAdminLogin />} />
    <Route element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}>
      <Route path="dashboard" element={<SuperAdminDashboard />} />
      <Route path="tenants" element={<TenantsList />} />
      <Route path="tenants/:id" element={<TenantDetail />} />
      <Route path="tenants/:id/categories" element={<TenantCategories />} />
      <Route path="categories" element={<GlobalCategories />} />
      <Route path="tenants/:id/supported-countries" element={<TenantSupportedCountries />} />
      <Route path="cities" element={<CitiesManager />} />
      <Route path="empresas" element={<TenantsList />} />
      <Route path="empresas/:id" element={<TenantDetail />} />
      <Route path="users" element={<UsersList />} />
      <Route path="landing" element={<LandingCMS />} />
      <Route path="business-types" element={<BusinessTypes />} />
    </Route>
  </Routes>
);

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/superadmin/*" element={<SuperAdminRoutes />} />
    <Route path="/*" element={<MainWrapper />} />
  </Routes>
);

export default AppRoutes;

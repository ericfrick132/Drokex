import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import { drokexColors } from '../../theme/drokexTheme';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: string[];
  requireCompany?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireRole = [],
  requireCompany = false 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: drokexColors.light,
        }}
      >
        <CircularProgress 
          sx={{ color: drokexColors.primary }}
          size={40}
        />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Redirigir al login y guardar la ubicación actual
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar roles requeridos
  if (requireRole.length > 0 && user) {
    const hasRequiredRole = requireRole.some(role => 
      user.role?.toLowerCase() === role.toLowerCase()
    );
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Verificar si requiere empresa y el usuario no tiene una
  if (requireCompany && user && !user.companyId) {
    return <Navigate to="/company/setup" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
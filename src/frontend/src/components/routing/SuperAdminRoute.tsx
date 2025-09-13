import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface Props { children: React.ReactNode }

const SuperAdminRoute: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;

  if (!token) {
    return <Navigate to="/superadmin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default SuperAdminRoute;


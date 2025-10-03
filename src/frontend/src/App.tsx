import React from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import drokexTheme from './theme/drokexTheme';
import AppRoutes from './AppRoutes';
import './App.css';


const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith('/superadmin');
  return isSuperAdmin ? <>{children}</> : <TenantProvider>{children}</TenantProvider>;
};

function App() {
  return (
    <ThemeProvider theme={drokexTheme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Providers>
            <AppRoutes />
          </Providers>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

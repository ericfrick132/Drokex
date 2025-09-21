import React from 'react';
import { AppBar, Toolbar, Box, IconButton, Button, Typography, Container, Menu, MenuItem } from '@mui/material';
import { Dashboard, Domain, Group, Logout } from '@mui/icons-material';
import { drokexColors } from '../../theme/drokexTheme';
import { useNavigate, useLocation } from 'react-router-dom';
import { DrokexLogo } from '../common';

interface Props { children: React.ReactNode }

const SuperAdminLayout: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('superadmin_refresh');
    localStorage.removeItem('superadmin_data');
    navigate('/superadmin/login');
  };

  const NavButton: React.FC<{ label: string; to: string; icon: React.ReactNode }> = ({ label, to, icon }) => (
    <Button
      color="inherit"
      onClick={() => navigate(to)}
      startIcon={icon as any}
      sx={{
        textTransform: 'none',
        color: '#fff',
        opacity: location.pathname === to ? 1 : 0.85,
        '&:hover': { color: drokexColors.primary, background: 'transparent' },
      }}
    >
      {label}
    </Button>
  );

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: drokexColors.light }}>
      <AppBar position="static" sx={{ backgroundColor: drokexColors.dark }}>
        <Toolbar sx={{ gap: 1 }}>
          <Box onClick={() => navigate('/superadmin/dashboard')} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', mr: 2 }}>
            <DrokexLogo variant="full" size="medium" color="white" withMargin={false} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mr: 2, display: { xs: 'none', sm: 'block' } }}>Super Admin</Typography>
          <NavButton label="Dashboard" to="/superadmin/dashboard" icon={<Dashboard />} />
          <NavButton label="Empresas" to="/superadmin/tenants" icon={<Domain />} />
          <NavButton label="Usuarios" to="/superadmin/users" icon={<Group />} />
          <Box sx={{ ml: 'auto' }}>
            <IconButton color="inherit" onClick={logout} title="Salir">
              <Logout />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
};

export default SuperAdminLayout;

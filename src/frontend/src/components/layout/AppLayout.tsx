import React from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar,
  Typography,
  Divider,
  Container 
} from '@mui/material';
import { 
  AccountCircle, 
  ExitToApp, 
  Dashboard,
  Business,
  Inventory
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { useNavigate } from 'react-router-dom';
import { DrokexLogo } from '../common';
import { drokexColors } from '../../theme/drokexTheme';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate('/');
  };

  const handleNavigation = (path: string) => {
    handleClose();
    navigate(path);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar 
        position="static" 
        sx={{ 
          backgroundColor: drokexColors.dark,
          boxShadow: '0 2px 4px rgba(22, 22, 22, 0.1)',
        }}
      >
        <Toolbar>
          {/* Logo */}
          <Box 
            onClick={() => navigate('/dashboard')}
            sx={{ cursor: 'pointer', flexGrow: 0, mr: 3 }}
          >
            <DrokexLogo variant="full" size="medium" color="white" withMargin={false} />
          </Box>

          {/* Tenant Info */}
          {tenant && (
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: drokexColors.primary,
                  fontWeight: 500,
                  fontSize: '0.9rem',
                }}
              >
                {tenant.name}
              </Typography>
            </Box>
          )}

          {/* User Menu */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  mr: 2, 
                  color: '#ffffff',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                {user.firstName} {user.lastName}
              </Typography>
              
              <IconButton
                size="large"
                aria-label="account menu"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar 
                  sx={{ 
                    bgcolor: drokexColors.primary, 
                    color: drokexColors.dark,
                    width: 32,
                    height: 32,
                    fontSize: '0.9rem',
                  }}
                >
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </Avatar>
              </IconButton>
              
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                sx={{
                  '& .MuiPaper-root': {
                    backgroundColor: '#ffffff',
                    minWidth: 200,
                    borderRadius: 2,
                    boxShadow: '0 4px 8px rgba(22, 22, 22, 0.15)',
                  }
                }}
              >
                <MenuItem onClick={() => handleNavigation('/dashboard')}>
                  <Dashboard sx={{ mr: 2, color: drokexColors.secondary }} />
                  Dashboard
                </MenuItem>
                
                {user.companyId && (
                  <MenuItem onClick={() => handleNavigation('/company')}>
                    <Business sx={{ mr: 2, color: drokexColors.secondary }} />
                    Mi Empresa
                  </MenuItem>
                )}
                
                <MenuItem onClick={() => handleNavigation('/products')}>
                  <Inventory sx={{ mr: 2, color: drokexColors.secondary }} />
                  Productos
                </MenuItem>
                
                <Divider />
                
                <MenuItem onClick={() => handleNavigation('/profile')}>
                  <AccountCircle sx={{ mr: 2, color: drokexColors.secondary }} />
                  Mi Perfil
                </MenuItem>
                
                <MenuItem onClick={handleLogout}>
                  <ExitToApp sx={{ mr: 2, color: '#d32f2f' }} />
                  Cerrar Sesión
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          backgroundColor: drokexColors.light,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default AppLayout;

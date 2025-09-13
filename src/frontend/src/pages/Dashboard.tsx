import React from 'react';
import { Box, Container } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import ProviderDashboard from '../components/dashboard/ProviderDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import BuyerDashboard from '../components/dashboard/BuyerDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'Admin':
        return <AdminDashboard />;
      case 'Provider':
        return <ProviderDashboard />;
      case 'Buyer':
        return <BuyerDashboard />;
      default:
        return <ProviderDashboard />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box>
        {renderDashboard()}
      </Box>
    </Container>
  );
};

export default Dashboard;
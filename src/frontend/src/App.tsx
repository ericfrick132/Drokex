import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import drokexTheme from './theme/drokexTheme';
import AppRoutes from './AppRoutes';
import './App.css';


function App() {
  return (
    <TenantProvider>
      <ThemeProvider theme={drokexTheme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </TenantProvider>
  );
}

export default App;
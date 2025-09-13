import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, Tooltip, Stack } from '@mui/material';
import { DrokexCard, DrokexCardContent } from '../../components/common';
import { Add, Edit, Login, Launch, CheckCircle } from '@mui/icons-material';
import superadminApi from '../../services/superadminApi';
import { drokexColors } from '../../theme/drokexTheme';

const TenantsList: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(params.get('create') === '1');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [form, setForm] = useState<any>({
    name: '',
    subdomain: '',
    country: '',
    countryCode: '',
    currency: 'USD',
    currencySymbol: '$',
    adminEmail: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('superadmin_token');
    if (!token) {
      navigate('/superadmin/login', { replace: true });
      return;
    }
    load();
  }, [navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await superadminApi.getTenants();
      setItems(data.data || []);
    } finally { setLoading(false); }
  };

  const submitCreate = async () => {
    await superadminApi.createTenant(form);
    setOpenCreate(false);
    params.delete('create');
    setParams(params, { replace: true });
    await load();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700 }}>Tenants</Typography>
        <Box display="flex" gap={1}>
          <Button variant={showPendingOnly ? 'outlined' : 'text'} onClick={() => setShowPendingOnly(v => !v)}>
            {showPendingOnly ? 'Ver todos' : 'Ver pendientes'}
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreate(true)}>Crear Tenant</Button>
        </Box>
      </Box>
      <DrokexCard>
        <DrokexCardContent sx={{ p: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Subdominio</TableCell>
                <TableCell>País</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell align="right">Empresas</TableCell>
                <TableCell align="right">Productos</TableCell>
                <TableCell align="right">Usuarios</TableCell>
                <TableCell align="right">Leads</TableCell>
                <TableCell align="right">Facturación</TableCell>
                <TableCell>Act.</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(showPendingOnly ? items.filter(x => !x.isActive) : items).map(t => (
                <TableRow key={t.id} hover>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.subdomain}</TableCell>
                  <TableCell>{t.country}</TableCell>
                  <TableCell>{t.planType || '-'}</TableCell>
                  <TableCell align="right">{t.statistics?.totalCompanies ?? 0}</TableCell>
                  <TableCell align="right">{t.statistics?.totalProducts ?? 0}</TableCell>
                  <TableCell align="right">{t.statistics?.totalUsers ?? 0}</TableCell>
                  <TableCell align="right">{t.statistics?.totalLeads ?? 0}</TableCell>
                  <TableCell align="right">{(t.totalRevenue ?? 0).toLocaleString(undefined, { style: 'currency', currency: t.currency || 'USD' })}</TableCell>
                  <TableCell>{t.isActive ? <Chip size="small" label="Sí" color="success"/> : <Chip size="small" label="No"/>}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {!t.isActive && (
                        <Tooltip title="Aprobar tenant">
                          <IconButton size="small" color="success" onClick={async () => {
                            try { await superadminApi.approveTenant(t.id); await load(); } catch {}
                          }}>
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Impersonar">
                        <IconButton size="small" color="primary" onClick={async () => {
                          try {
                            const { data } = await superadminApi.impersonate(t.id);
                            const url = window.location.hostname === 'localhost' ? data.data.devRedirectUrl : data.data.prodRedirectUrl;
                            window.location.href = url;
                          } catch {}
                        }}>
                          <Login fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => navigate(`/superadmin/tenants/${t.id}`)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Abrir app">
                        <IconButton size="small" onClick={() => window.open(`http://${t.subdomain}.localhost:3100`, '_blank')}>
                          <Launch fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>No hay tenants</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DrokexCardContent>
      </DrokexCard>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>Crear Tenant</DialogTitle>
        <DialogContent dividers>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
            <TextField label="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField label="Subdominio" value={form.subdomain} onChange={e => setForm({ ...form, subdomain: e.target.value })} fullWidth />
            <TextField label="País" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} fullWidth />
            <TextField label="Código País" value={form.countryCode} onChange={e => setForm({ ...form, countryCode: e.target.value })} fullWidth />
            <TextField label="Moneda" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} fullWidth />
            <TextField label="Símbolo" value={form.currencySymbol} onChange={e => setForm({ ...form, currencySymbol: e.target.value })} fullWidth />
            <TextField label="Email Admin" value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancelar</Button>
          <Button variant="contained" onClick={submitCreate}>Crear</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TenantsList;

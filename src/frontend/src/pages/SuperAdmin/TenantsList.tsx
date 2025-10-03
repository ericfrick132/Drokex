import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, Tooltip, Stack } from '@mui/material';
import { DrokexCard, DrokexCardContent } from '../../components/common';
import { Add, Edit, Login, Launch, CheckCircle } from '@mui/icons-material';
import superadminApi from '../../services/superadminApi';
import { drokexColors } from '../../theme/drokexTheme';

type FormState = {
  name: string;
  subdomain: string;
  country: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
  adminEmail: string;
};

const TenantsList: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: '',
    subdomain: '',
    country: '',
    countryCode: '',
    currency: 'USD',
    currencySymbol: '$',
    adminEmail: ''
  });
  const [subdomainTouched, setSubdomainTouched] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({});

  // Helper: sanitize to a valid subdomain label (RFC 1034/1123-ish)
  const toSubdomain = (raw: string) => {
    if (!raw) return '';
    // remove diacritics, lower, replace non-alphanum with hyphen
    let s = raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '');
    // enforce max label length 63
    if (s.length > 63) s = s.slice(0, 63).replace(/-+$/g, '');
    return s;
  };

  // Check subdomain availability (debounced)
  useEffect(() => {
    const s = form.subdomain;
    if (!s) { setSubdomainStatus('invalid'); return; }
    const isValid = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(s) && s.length >= 3 && s.length <= 63;
    if (!isValid) { setSubdomainStatus('invalid'); return; }
    setSubdomainStatus('checking');
    const t = setTimeout(async () => {
      try {
        const { data } = await superadminApi.checkSubdomain(s);
        setSubdomainStatus(data.available ? 'available' : 'taken');
      } catch { setSubdomainStatus('invalid'); }
    }, 400);
    return () => clearTimeout(t);
  }, [form.subdomain]);

  const isCreateDisabled = () => {
    const errs: { [k: string]: string } = {};
    if (!form.name.trim()) errs.name = 'Requerido';
    if (!form.adminEmail.trim() || !/\S+@\S+\.\S+/.test(form.adminEmail)) errs.adminEmail = 'Email inválido';
    if (subdomainStatus !== 'available') errs.subdomain = 'Subdominio inválido o en uso';
    setFormErrors(errs);
    return Object.keys(errs).length > 0;
  };

  useEffect(() => {
    // Debug: confirm mount
    try { console.debug('[TenantsList] mount'); } catch {}
    const token = localStorage.getItem('superadmin_token');
    if (!token) {
      navigate('/superadmin/login', { replace: true });
      return;
    }
    // abrir modal si ?create=1
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('create') === '1') setOpenCreate(true);
    } catch {}
    load();
  }, [navigate]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await superadminApi.getTenants();
      setItems(data.data || []);
    } catch (err: any) {
      console.error('Error cargando empresas (tenants):', err);
      setError(err?.response?.data?.message || 'No se pudieron cargar las empresas');
      setItems([]);
    } finally { setLoading(false); }
  };

  const submitCreate = async () => {
    // Validar antes de enviar
    if (isCreateDisabled()) return;
    await superadminApi.createTenant(form);
    setOpenCreate(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('create');
      window.history.replaceState({}, '', url.toString());
    } catch {}
    await load();
  };

  return (
    <Box>
      {error && (
        <Box mb={2} sx={{ color: '#b71c1c', background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: 1, p: 2 }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700 }}>Empresas</Typography>
        <Box display="flex" gap={1}>
          <Button variant={showPendingOnly ? 'outlined' : 'text'} onClick={() => setShowPendingOnly(v => !v)}>
            {showPendingOnly ? 'Ver todos' : 'Ver pendientes'}
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreate(true)}>Crear Empresa</Button>
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
              {loading && (
                <TableRow>
                  <TableCell colSpan={11}>
                    <Typography variant="body2" color="text.secondary">Cargando empresas…</Typography>
                  </TableCell>
                </TableRow>
              )}
              {!loading && (showPendingOnly ? items.filter(x => !x.isActive) : items).map(t => (
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
                        <Tooltip title="Aprobar empresa">
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
              {!loading && items.length === 0 && !error && (
                <TableRow>
                  <TableCell colSpan={11}>No hay empresas</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DrokexCardContent>
      </DrokexCard>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>Crear Empresa</DialogTitle>
        <DialogContent dividers>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
            <TextField 
              label="Nombre"
              value={form.name}
              onChange={e => {
                const name = e.target.value;
                setForm((prev: FormState) => ({
                  ...prev,
                  name,
                  subdomain: subdomainTouched ? prev.subdomain : toSubdomain(name),
                }));
              }} 
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth 
            />
            <TextField 
              label="Subdominio"
              value={form.subdomain}
              onChange={e => {
                const sanitized = toSubdomain(e.target.value);
                setSubdomainTouched(true);
                setForm((prev: FormState) => ({ ...prev, subdomain: sanitized }));
              }}
              error={subdomainStatus === 'invalid' || subdomainStatus === 'taken'}
              helperText={
                subdomainStatus === 'checking' ? 'Verificando disponibilidad…' :
                subdomainStatus === 'taken' ? 'Ya está en uso' :
                'Solo letras, números y guiones; 3-63 caracteres'
              }
              fullWidth 
            />
            <TextField label="País" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} fullWidth />
            <TextField label="Código País" value={form.countryCode} onChange={e => setForm({ ...form, countryCode: e.target.value.toUpperCase() })} inputProps={{ maxLength: 2 }} helperText="Ej: HN, GT, MX, DO, SV" fullWidth />
            <TextField label="Moneda" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })} inputProps={{ maxLength: 3 }} helperText="Ej: USD, HNL, GTQ, MXN, DOP, SVC" fullWidth />
            <TextField label="Símbolo" value={form.currencySymbol} onChange={e => setForm({ ...form, currencySymbol: e.target.value })} inputProps={{ maxLength: 3 }} fullWidth />
            <TextField label="Email Admin" value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })} error={!!formErrors.adminEmail} helperText={formErrors.adminEmail} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancelar</Button>
          <Button variant="contained" onClick={submitCreate} disabled={isCreateDisabled()}>Crear</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TenantsList;

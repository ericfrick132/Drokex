import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Stack } from '@mui/material';
import { DrokexCard, DrokexCardContent, DrokexButton } from '../components/common';
import { drokexColors } from '../theme/drokexTheme';
import { tenantUsersApi } from '../services/api';

const roles = ['Admin','Staff','Provider','Buyer'];

const AdminUsers: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', role: 'Staff' });
  const [editId, setEditId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await tenantUsersApi.getUsers(1, 100);
      setItems(data.data?.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (editId) {
      await tenantUsersApi.updateUser(editId, { firstName: form.firstName, lastName: form.lastName, role: form.role });
    } else {
      await tenantUsersApi.createUser(form as any);
    }
    setOpen(false); setEditId(null);
    setForm({ email: '', firstName: '', lastName: '', role: 'Staff' });
    await load();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700 }}>Usuarios del Tenant</Typography>
        <DrokexButton variant="primary" onClick={() => { setOpen(true); setEditId(null); }}>Nuevo Usuario</DrokexButton>
      </Box>
      <DrokexCard>
        <DrokexCardContent sx={{ p: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(u => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.firstName} {u.lastName}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.isActive ? <Chip size="small" label="Activo" color="success"/> : <Chip size="small" label="Inactivo"/>}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <DrokexButton variant="outline" size="small" onClick={() => { setEditId(u.id); setForm({ email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role }); setOpen(true); }}>Editar</DrokexButton>
                      <DrokexButton variant="secondary" size="small" onClick={async () => { await tenantUsersApi.resetPassword(u.id); }}>Reset Pass</DrokexButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>No hay usuarios</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DrokexCardContent>
      </DrokexCard>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            {!editId && (
              <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Nombre" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} fullWidth />
              <TextField label="Apellido" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} fullWidth />
            </Stack>
            <FormControl fullWidth>
              <InputLabel id="role-label">Rol</InputLabel>
              <Select labelId="role-label" label="Rol" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}>
                {roles.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <DrokexButton variant="ghost" onClick={() => setOpen(false)}>Cancelar</DrokexButton>
          <DrokexButton variant="primary" onClick={save}>Guardar</DrokexButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsers;


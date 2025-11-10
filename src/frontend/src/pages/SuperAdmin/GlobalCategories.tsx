import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { DrokexButton, DrokexCard, DrokexCardContent } from '../../components/common';
import { drokexColors } from '../../theme/drokexTheme';
import superadminApi from '../../services/superadminApi';

interface Cat {
  id: number;
  name: string;
  description: string;
  displayOrder: number;
  productsCount: number;
}

const GlobalCategories: React.FC = () => {
  const [items, setItems] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', description: '', displayOrder: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('superadmin_token');
      if (!token) return;
      const { data } = await superadminApi.getGlobalCategories();
      if (data.data) setItems(data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const startCreate = () => {
    setEditId(null);
    setForm({ name: '', description: '', displayOrder: (items[items.length - 1]?.displayOrder ?? 0) + 1 });
    setOpen(true);
  };
  const startEdit = (c: Cat) => {
    setEditId(c.id);
    setForm({ name: c.name, description: c.description, displayOrder: c.displayOrder });
    setOpen(true);
  };
  const save = async () => {
    if (!form.name.trim()) return;
    if (editId) {
      await superadminApi.updateGlobalCategory(editId, { name: form.name, description: form.description, displayOrder: form.displayOrder });
    } else {
      await superadminApi.createGlobalCategory({ name: form.name, description: form.description, displayOrder: form.displayOrder });
    }
    setOpen(false);
    await load();
  };
  const remove = async (id: number) => {
    if (!window.confirm('¿Eliminar categoría?')) return;
    await superadminApi.deleteGlobalCategory(id);
    await load();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 2 }}>Categorías Globales</Typography>
      <DrokexCard>
        <DrokexCardContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2 }}>
            <Typography variant="subtitle1" sx={{ color: drokexColors.secondary }}>Total: {items.length}</Typography>
            <DrokexButton variant="primary" startIcon={<Add />} onClick={startCreate}>Nueva Categoría</DrokexButton>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Orden</TableCell>
                <TableCell>Productos</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(c => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.id}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.description}</TableCell>
                  <TableCell>{c.displayOrder}</TableCell>
                  <TableCell>{c.productsCount}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => startEdit(c)}><Edit /></IconButton>
                    <IconButton size="small" onClick={() => remove(c.id)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>No hay categorías</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DrokexCardContent>
      </DrokexCard>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
        <DialogContent>
          <TextField label="Nombre" fullWidth margin="normal" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <TextField label="Descripción" fullWidth margin="normal" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <TextField label="Orden" type="number" fullWidth margin="normal" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })} />
        </DialogContent>
        <DialogActions>
          <DrokexButton variant="ghost" onClick={() => setOpen(false)}>Cancelar</DrokexButton>
          <DrokexButton variant="primary" onClick={save}>Guardar</DrokexButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GlobalCategories;


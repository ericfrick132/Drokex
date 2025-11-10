import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip } from '@mui/material';
import { Add, Edit, Delete, UploadFile } from '@mui/icons-material';
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

const TenantCategories: React.FC = () => {
  const { id } = useParams();
  const tenantId = Number(id);
  const navigate = useNavigate();
  const [items, setItems] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', description: '', displayOrder: 0 });
  const [openImport, setOpenImport] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('superadmin_token');
      if (!token) { navigate('/superadmin/login', { replace: true }); return; }
      const { data } = await superadminApi.getTenantCategories(tenantId);
      if (data.data) setItems(data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tenantId]);

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
      await superadminApi.updateTenantCategory(tenantId, editId, { name: form.name, description: form.description, displayOrder: form.displayOrder });
    } else {
      await superadminApi.createTenantCategory(tenantId, { name: form.name, description: form.description, displayOrder: form.displayOrder });
    }
    setOpen(false);
    await load();
  };
  const remove = async (id: number) => {
    if (!window.confirm('¿Eliminar categoría?')) return;
    await superadminApi.deleteTenantCategory(tenantId, id);
    await load();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 2 }}>Categorías del Tenant</Typography>
      <DrokexCard>
        <DrokexCardContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2 }}>
            <Typography variant="subtitle1" sx={{ color: drokexColors.secondary }}>Total: {items.length}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <DrokexButton variant="outline" startIcon={<UploadFile />} onClick={() => setOpenImport(true)}>Importar CSV</DrokexButton>
              <DrokexButton variant="ghost" onClick={async () => {
                try {
                  const res = await fetch('/default_categories.csv', { cache: 'no-cache' });
                  if (!res.ok) return;
                  const text = await res.text();
                  setCsvText(text);
                  setOpenImport(true);
                } catch {}
              }}>Importar base sugerida</DrokexButton>
              <DrokexButton variant="primary" onClick={async () => {
                try {
                  setSeeding(true);
                  const res = await fetch('/default_categories.csv', { cache: 'no-cache' });
                  if (!res.ok) return;
                  const text = await res.text();
                  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                  let orderBase = items.length ? Math.max(...items.map(i => i.displayOrder)) + 1 : 1;
                  for (let i = 0; i < lines.length; i++) {
                    const name = lines[i];
                    try { await superadminApi.createTenantCategory(tenantId, { name, displayOrder: orderBase + i }); } catch {}
                  }
                  await load();
                } finally { setSeeding(false); }
              }} disabled={seeding}>{seeding ? 'Sembrando…' : 'Sembrar base sugerida'}</DrokexButton>
              <DrokexButton variant="primary" startIcon={<Add />} onClick={startCreate}>Nueva Categoría</DrokexButton>
            </Box>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
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
                  <TableCell colSpan={5}>No hay categorías</TableCell>
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

      <Dialog open={openImport} onClose={() => setOpenImport(false)} fullWidth maxWidth="sm">
        <DialogTitle>Importar Categorías (CSV rápido)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: drokexColors.secondary, mb: 1 }}>
            Formato: Nombre[,Descripción][,Orden]. Una categoría por línea. Ejemplos:
          </Typography>
          <Box sx={{ p: 1, background: '#f9fafb', borderRadius: 1, fontFamily: 'monospace', fontSize: 12, color: drokexColors.dark }}>
            Bebidas\nConservas,Enlatados y conservas\nLácteos,Productos lácteos,10
          </Box>
          <TextField
            multiline
            minRows={6}
            fullWidth
            margin="normal"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={"Nombre\nNombre,Descripción\nNombre,Descripción,Orden"}
          />
          <Typography variant="caption" sx={{ color: drokexColors.secondary }}>
            Se crearán en orden de aparición si no se especifica el orden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <DrokexButton variant="ghost" onClick={() => setOpenImport(false)}>Cancelar</DrokexButton>
          <DrokexButton variant="primary" onClick={async () => {
            const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            let orderBase = items.length ? Math.max(...items.map(i => i.displayOrder)) + 1 : 1;
            for (let i = 0; i < lines.length; i++) {
              const raw = lines[i];
              const parts = raw.split(',');
              const name = (parts[0] || '').trim();
              if (!name) continue;
              const description = (parts[1] || '').trim();
              const order = parts[2] ? Number(parts[2]) : (orderBase + i);
              try {
                await superadminApi.createTenantCategory(tenantId, { name, description, displayOrder: order });
              } catch {}
            }
            setOpenImport(false);
            setCsvText('');
            await load();
          }}>Importar</DrokexButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TenantCategories;

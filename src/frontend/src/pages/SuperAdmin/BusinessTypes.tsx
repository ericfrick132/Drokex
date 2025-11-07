import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, IconButton, TextField, Switch, Button, Stack } from '@mui/material';
import { Edit, Delete, Save, Close, Add } from '@mui/icons-material';
import { drokexColors } from '../../theme/drokexTheme';
import superadminApi from '../../services/superadminApi';

interface BusinessType {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

const BusinessTypes: React.FC = () => {
  const [items, setItems] = useState<BusinessType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<BusinessType>>({});
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await superadminApi.getBusinessTypes();
      if (data?.data) setItems(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (it: BusinessType) => { setEditingId(it.id); setDraft({ ...it }); };
  const cancelEdit = () => { setEditingId(null); setDraft({}); };
  const saveEdit = async () => {
    if (!editingId) return;
    await superadminApi.updateBusinessType(editingId, {
      name: draft.name,
      description: draft.description,
      displayOrder: draft.displayOrder,
      isActive: draft.isActive,
    } as any);
    setEditingId(null);
    setDraft({});
    await load();
  };

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await superadminApi.createBusinessType({ name: newName.trim() });
      setNewName('');
      await load();
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: number) => {
    const ok = window.confirm('¿Eliminar este tipo de negocio?');
    if (!ok) return;
    await superadminApi.deleteBusinessType(id);
    await load();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 2 }}>Tipos de Negocio</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2 }}>
        <TextField size="small" label="Nuevo tipo" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button variant="contained" startIcon={<Add />} onClick={create} disabled={creating}>Añadir</Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Descripción</TableCell>
            <TableCell>Orden</TableCell>
            <TableCell>Activo</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((it) => (
            <TableRow key={it.id} hover>
              <TableCell>{it.id}</TableCell>
              <TableCell>
                {editingId === it.id ? (
                  <TextField size="small" value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                ) : (
                  it.name
                )}
              </TableCell>
              <TableCell>
                {editingId === it.id ? (
                  <TextField size="small" value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                ) : (
                  it.description
                )}
              </TableCell>
              <TableCell>
                {editingId === it.id ? (
                  <TextField size="small" type="number" value={draft.displayOrder ?? 0} onChange={(e) => setDraft({ ...draft, displayOrder: Number(e.target.value) })} />
                ) : (
                  it.displayOrder
                )}
              </TableCell>
              <TableCell>
                {editingId === it.id ? (
                  <Switch checked={!!draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />
                ) : (
                  <Switch checked={it.isActive} disabled />
                )}
              </TableCell>
              <TableCell align="right">
                {editingId === it.id ? (
                  <>
                    <IconButton onClick={saveEdit}><Save /></IconButton>
                    <IconButton onClick={cancelEdit}><Close /></IconButton>
                  </>
                ) : (
                  <>
                    <IconButton onClick={() => startEdit(it)}><Edit /></IconButton>
                    <IconButton onClick={() => remove(it.id)}><Delete /></IconButton>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
          {!loading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>No hay tipos de negocio configurados</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
};

export default BusinessTypes;


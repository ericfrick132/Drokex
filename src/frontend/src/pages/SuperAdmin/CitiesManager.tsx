import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, Button, Tooltip } from '@mui/material';
import { Add, Delete, Edit, Save, Close, Public } from '@mui/icons-material';
import { drokexColors } from '../../theme/drokexTheme';
import superadminApi from '../../services/superadminApi';
import { COUNTRIES } from '../../data/countries';
import { DrokexCard, DrokexCardContent, DrokexButton } from '../../components/common';

interface CityItem { id: number; countryCode: string; name: string; displayOrder: number; isActive: boolean; }

const CitiesManager: React.FC = () => {
  const [country, setCountry] = useState<string>('MX');
  const [items, setItems] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CityItem | null>(null);

  const countries = useMemo(() => COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)), []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await superadminApi.getCities(country);
      setItems(data.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [country]);

  const startCreate = () => {
    setEditing({ id: 0, countryCode: country, name: '', displayOrder: (items[items.length - 1]?.displayOrder ?? 0) + 1, isActive: true });
    setOpen(true);
  };
  const startEdit = (c: CityItem) => { setEditing({ ...c }); setOpen(true); };
  const cancel = () => { setOpen(false); setEditing(null); };
  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) return;
    if (editing.id) {
      await superadminApi.updateCity(editing.id, { name: editing.name, countryCode: editing.countryCode, displayOrder: editing.displayOrder, isActive: editing.isActive });
    } else {
      await superadminApi.createCity({ name: editing.name, countryCode: editing.countryCode, displayOrder: editing.displayOrder, isActive: editing.isActive });
    }
    cancel();
    await load();
  };
  const remove = async (id: number) => {
    const ok = window.confirm('¿Eliminar ciudad?');
    if (!ok) return;
    await superadminApi.deleteCity(id);
    await load();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 2 }}>Catálogo de Ciudades por País</Typography>
      <DrokexCard>
        <DrokexCardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel id="country">País</InputLabel>
              <Select labelId="country" label="País" value={country} onChange={(e) => setCountry(e.target.value as string)}>
                {countries.map(c => (<MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>))}
              </Select>
            </FormControl>
            <DrokexButton variant="primary" startIcon={<Add />} onClick={startCreate}>Añadir ciudad</DrokexButton>
          </Box>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Ciudad</TableCell>
                <TableCell>País</TableCell>
                <TableCell>Orden</TableCell>
                <TableCell>Activa</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(it => (
                <TableRow key={it.id} hover>
                  <TableCell>{it.id}</TableCell>
                  <TableCell>{it.name}</TableCell>
                  <TableCell>{it.countryCode}</TableCell>
                  <TableCell>{it.displayOrder}</TableCell>
                  <TableCell><Switch checked={it.isActive} disabled /></TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => startEdit(it)}><Edit /></IconButton>
                    <IconButton onClick={() => remove(it.id)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>No hay ciudades configuradas para {country}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DrokexCardContent>
      </DrokexCard>

      <Dialog open={open} onClose={cancel} fullWidth maxWidth="sm">
        <DialogTitle>{editing?.id ? 'Editar ciudad' : 'Crear ciudad'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="country2">País</InputLabel>
              <Select size="small" labelId="country2" label="País" value={editing?.countryCode || country} onChange={(e) => setEditing(prev => prev ? { ...prev, countryCode: e.target.value as string } : prev)}>
                {countries.map(c => (<MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>))}
              </Select>
            </FormControl>
            <TextField size="small" label="Nombre" value={editing?.name || ''} onChange={(e) => setEditing(prev => prev ? { ...prev, name: e.target.value } : prev)} />
            <TextField size="small" type="number" label="Orden" value={editing?.displayOrder ?? 0} onChange={(e) => setEditing(prev => prev ? { ...prev, displayOrder: Number(e.target.value) } : prev)} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Switch checked={!!editing?.isActive} onChange={(e) => setEditing(prev => prev ? { ...prev, isActive: e.target.checked } : prev)} /> Activa
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<Close />} onClick={cancel}>Cancelar</Button>
          <Button startIcon={<Save />} variant="contained" onClick={save}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CitiesManager;


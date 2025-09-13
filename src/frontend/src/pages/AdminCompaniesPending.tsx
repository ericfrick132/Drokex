import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { DrokexButton } from '../components/common';
import { companiesApi } from '../services/api';
import { Company } from '../types';
import { drokexColors } from '../theme/drokexTheme';

const AdminCompaniesPending: React.FC = () => {
  const [items, setItems] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await companiesApi.getCompanies(1, 50, undefined, false);
      if (data.data) setItems(data.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: number) => {
    await companiesApi.approveCompany(id);
    await load();
  };

  const openReject = (id: number) => { setRejectId(id); setReason(''); };
  const doReject = async () => {
    if (!rejectId) return;
    await companiesApi.rejectCompany(rejectId, { reason, deactivate: true });
    setRejectId(null); setReason('');
    await load();
  };

  return (
    <>
    <Box>
      <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 2 }}>Empresas Pendientes de Aprobación</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Empresa</TableCell>
            <TableCell>Contacto</TableCell>
            <TableCell>Teléfono</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map(c => (
            <TableRow key={c.id} hover>
              <TableCell>{c.name}</TableCell>
              <TableCell>{c.contactEmail}</TableCell>
              <TableCell>{c.phone}</TableCell>
              <TableCell align="right" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <DrokexButton size="small" variant="primary" onClick={() => approve(c.id)}>Aprobar</DrokexButton>
                <DrokexButton size="small" variant="outline" onClick={() => openReject(c.id)}>Rechazar</DrokexButton>
              </TableCell>
            </TableRow>
          ))}
          {!loading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>No hay empresas pendientes</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
    <Dialog open={rejectId != null} onClose={() => setRejectId(null)} maxWidth="sm" fullWidth>
      <DialogTitle>Rechazar empresa</DialogTitle>
      <DialogContent>
        <TextField autoFocus fullWidth label="Motivo" multiline minRows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <DrokexButton variant="ghost" onClick={() => setRejectId(null)}>Cancelar</DrokexButton>
        <DrokexButton variant="secondary" onClick={doReject} disabled={!reason.trim()}>Rechazar</DrokexButton>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default AdminCompaniesPending;

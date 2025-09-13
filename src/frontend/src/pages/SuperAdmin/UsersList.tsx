import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, TextField, Accordion, AccordionSummary, AccordionDetails, Chip } from '@mui/material';
import { DrokexCard, DrokexCardContent } from '../../components/common';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import superadminApi from '../../services/superadminApi';
import { drokexColors } from '../../theme/drokexTheme';

const UsersList: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await superadminApi.getUsers(tenantId ? Number(tenantId) : undefined);
      setItems(data.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const map = new Map<number, { tenantName: string; users: any[] }>();
    for (const u of items) {
      const id = u.tenant?.id || 0;
      const name = u.tenant?.name || 'Sin Tenant';
      if (!map.has(id)) map.set(id, { tenantName: name, users: [] });
      map.get(id)!.users.push(u);
    }
    return Array.from(map.entries()).map(([id, v]) => ({ tenantId: id, ...v }));
  }, [items]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700 }}>Usuarios</Typography>
        <TextField size="small" label="Filtrar por TenantId" value={tenantId} onChange={e => setTenantId(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(); }} />
      </Box>
      {grouped.map(group => (
        <Box key={group.tenantId} sx={{ mb: 2 }}>
          <DrokexCard>
            <DrokexCardContent sx={{ p: 0 }}>
              <Accordion defaultExpanded disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: drokexColors.dark }}>{group.tenantName}</Typography>
                    <Chip size="small" label={`${group.users.length}`} />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Email</TableCell>
                        <TableCell>Nombre</TableCell>
                        <TableCell>Rol</TableCell>
                        <TableCell>Empresa</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.users.map(u => (
                        <TableRow key={u.id} hover>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.firstName} {u.lastName}</TableCell>
                          <TableCell>{u.role}</TableCell>
                          <TableCell>{u.company?.name || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionDetails>
              </Accordion>
            </DrokexCardContent>
          </DrokexCard>
        </Box>
      ))}
      {!loading && items.length === 0 && (
        <DrokexCard>
          <DrokexCardContent>
            <Typography>No hay usuarios</Typography>
          </DrokexCardContent>
        </DrokexCard>
      )}
    </Box>
  );
};

export default UsersList;

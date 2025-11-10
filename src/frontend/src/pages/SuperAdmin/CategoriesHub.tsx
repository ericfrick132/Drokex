import React, { useEffect, useState } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { drokexColors } from '../../theme/drokexTheme';
import superadminApi from '../../services/superadminApi';
import { DrokexCard, DrokexCardContent } from '../../components/common';

const CategoriesHub: React.FC = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<{ id: number; name: string; country: string }[]>([]);
  const [tenantId, setTenantId] = useState<number | ''>('');

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('superadmin_token');
      if (!token) { navigate('/superadmin/login', { replace: true }); return; }
      const { data } = await superadminApi.getTenants();
      const list = (data?.data || []).map((t: any) => ({ id: t.id, name: t.name, country: t.country }));
      setTenants(list);
    })();
  }, [navigate]);

  return (
    <Box>
      <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 2 }}>Categorías por Marketplace</Typography>
      <DrokexCard>
        <DrokexCardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 260 }}>
              <InputLabel id="tenant">Selecciona Marketplace</InputLabel>
              <Select labelId="tenant" label="Selecciona Marketplace" value={tenantId} onChange={(e) => setTenantId(e.target.value as number)}>
                {tenants.map(t => (
                  <MenuItem key={t.id} value={t.id}>{t.name} · {t.country}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" disabled={!tenantId} onClick={() => navigate(`/superadmin/tenants/${tenantId}/categories`)}>Gestionar Categorías</Button>
          </Box>
        </DrokexCardContent>
      </DrokexCard>
    </Box>
  );
};

export default CategoriesHub;


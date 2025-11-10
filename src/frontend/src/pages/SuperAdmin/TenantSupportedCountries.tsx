import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Chip, Button } from '@mui/material';
import { drokexColors } from '../../theme/drokexTheme';
import { COUNTRIES } from '../../data/countries';
import superadminApi from '../../services/superadminApi';
import { DrokexCard, DrokexCardContent, DrokexButton } from '../../components/common';

const TenantSupportedCountries: React.FC = () => {
  const { id } = useParams();
  const tenantId = Number(id);
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const countries = useMemo(() => COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)), []);

  const load = async () => {
    const { data } = await superadminApi.getTenantSupportedCountries(tenantId);
    setSelected(data.data || []);
  };

  useEffect(() => { load(); }, [tenantId]);

  const save = async () => {
    setSaving(true);
    try {
      await superadminApi.setTenantSupportedCountries(tenantId, selected);
      navigate(`/superadmin/tenants/${tenantId}`);
    } finally { setSaving(false); }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 2 }}>Países soportados por el Tenant</Typography>
      <DrokexCard>
        <DrokexCardContent>
          <FormControl fullWidth>
            <InputLabel id="countries">Países</InputLabel>
            <Select
              labelId="countries"
              multiple
              value={selected}
              onChange={(e) => setSelected(e.target.value as string[])}
              input={<OutlinedInput label="Países" />}
              renderValue={(selectedCodes) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selectedCodes as string[]).map((code) => (
                    <Chip key={code} label={`${code} - ${countries.find(c => c.code === code)?.name || code}`} />
                  ))}
                </Box>
              )}
            >
              {countries.map(c => (
                <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={() => navigate(-1)}>Cancelar</Button>
            <DrokexButton variant="primary" loading={saving} onClick={save}>Guardar Cambios</DrokexButton>
          </Box>
        </DrokexCardContent>
      </DrokexCard>
    </Box>
  );
};

export default TenantSupportedCountries;


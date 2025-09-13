import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';
import { drokexColors } from '../theme/drokexTheme';
import { DrokexCard, DrokexCardContent } from '../components/common';
import { Category } from '../types';
import { catalogApi } from '../services/api';

const AdminCategories: React.FC = () => {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await catalogApi.getCategories();
      if (data.data) setItems(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Box>
      <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 2 }}>Categorías del Tenant</Typography>
      <DrokexCard>
        <DrokexCardContent sx={{ p: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Orden</TableCell>
                <TableCell>Productos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(c => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.description}</TableCell>
                  <TableCell>{c.displayOrder}</TableCell>
                  <TableCell>
                    <Chip size="small" label={c.productsCount} color="default" />
                  </TableCell>
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>No hay categorías configuradas</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DrokexCardContent>
      </DrokexCard>
    </Box>
  );
};

export default AdminCategories;


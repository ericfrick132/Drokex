import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Typography, TextField, InputAdornment, IconButton, Pagination, Chip } from '@mui/material';
import { Search } from '@mui/icons-material';
import PublicNavbar from '../components/layout/PublicNavbar';
import PublicFooter from '../components/layout/PublicFooter';
import { DrokexCard, DrokexCardContent, DrokexButton, DrokexPattern } from '../components/common';
import { catalogApi } from '../services/api';
import { Company } from '../types';
import { drokexColors } from '../theme/drokexTheme';
import { useNavigate } from 'react-router-dom';

const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await catalogApi.getCompanies(page, pageSize, search.trim() || undefined);
        if (!cancelled && data.data) {
          setCompanies(data.data.data);
          setTotalPages(data.data.totalPages);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page, pageSize, search]);

  const onSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') setPage(1);
  };

  const CompanyCard: React.FC<{ c: Company }> = ({ c }) => {
    return (
      <DrokexCard variant="interactive" sx={{ height: '100%' }}>
        <DrokexCardContent>
          <Typography variant="h6" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 0.5 }}>
            {c.name}
          </Typography>
          <Typography variant="body2" sx={{ color: drokexColors.secondary, mb: 1.5 }}>
            {c.description?.slice(0, 120) || ''}{c.description && c.description.length > 120 ? '…' : ''}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5, flexWrap: 'wrap' }}>
            <Chip size="small" label={`${c.productsCount} productos`} />
            {c.website && (
              <Chip size="small" label={(() => { try { return new URL(c.website).hostname; } catch { return c.website; } })()} variant="outlined" />
            )}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <DrokexButton size="small" variant="primary" onClick={() => navigate(`/companies/${c.id}`)}>
              Ver perfil
            </DrokexButton>
          </Box>
        </DrokexCardContent>
      </DrokexCard>
    );
  };

  return (
    <DrokexPattern pattern="diagonal" opacity={0.02}>
      <Box sx={{ minHeight: '100vh', backgroundColor: drokexColors.light }}>
        <PublicNavbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 2 }}>
            Directorio de Empresas
          </Typography>

          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Buscar empresas por nombre o descripción…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchEnter}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setPage(1)}>
                      <Search />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Grid container spacing={3}>
            {companies.map((c) => (
              <Grid item xs={12} sm={6} md={4} key={c.id}>
                <CompanyCard c={c} />
              </Grid>
            ))}
            {!loading && companies.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', color: drokexColors.secondary, py: 6 }}>
                  No se encontraron empresas
                </Box>
              </Grid>
            )}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Box>
        </Container>
        <PublicFooter />
      </Box>
    </DrokexPattern>
  );
};

export default Companies;

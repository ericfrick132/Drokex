import React, { useEffect, useMemo, useState } from 'react';
import { Box, Container, Grid, Typography, TextField, InputAdornment, IconButton, Select, MenuItem, FormControl, InputLabel, Pagination } from '@mui/material';
import { Search } from '@mui/icons-material';
import PublicNavbar from '../components/layout/PublicNavbar';
import PublicFooter from '../components/layout/PublicFooter';
import { DrokexCard, DrokexCardContent, DrokexButton, DrokexPattern } from '../components/common';
import { catalogApi } from '../services/api';
import { Category, Product } from '../types';
import { drokexColors } from '../theme/drokexTheme';
import { useNavigate, useLocation } from 'react-router-dom';

const Catalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [companyId, setCompanyId] = useState<number | ''>('');

  useEffect(() => {
    let cancelled = false;
    const loadCategories = async () => {
      try {
        const { data } = await catalogApi.getCategories();
        if (!cancelled && data.data) setCategories(data.data);
      } catch {}
    };
    loadCategories();
    // Read params from query on first load
    const params = new URLSearchParams(location.search);
    const cid = params.get('companyId');
    if (cid) setCompanyId(Number(cid));
    const q = params.get('search');
    if (q) setSearch(q);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params: any = { page, pageSize, sortBy: 'createdAt', sortOrder: 'desc' };
        if (search.trim()) params.search = search.trim();
        if (categoryId) params.categoryId = categoryId;
        if (companyId) params.companyId = companyId;
        const { data } = await catalogApi.getProducts(params);
        if (!cancelled && data.data) {
          setProducts(data.data.data);
          setTotalPages(data.data.totalPages);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [search, categoryId, companyId, page, pageSize]);

  const onSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') setPage(1);
  };

  const ProductCard: React.FC<{ p: Product }> = ({ p }) => {
    const cover = p.images?.[0]?.imageUrl || '';
    return (
      <DrokexCard variant="interactive" sx={{ height: '100%' }}>
        <DrokexCardContent>
          <Box sx={{ mb: 1, aspectRatio: '4/3', width: '100%', overflow: 'hidden', borderRadius: 2, backgroundColor: '#f7f7f7' }}>
            {cover ? (
              <Box component="img" src={cover} alt={p.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: drokexColors.secondary }}>
                Sin imagen
              </Box>
            )}
          </Box>
          <Typography variant="h6" sx={{ color: drokexColors.dark, fontWeight: 600, mb: 0.5 }}>
            {p.name}
          </Typography>
          <Typography variant="body2" sx={{ color: drokexColors.secondary, mb: 1 }}>
            {p.companyName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body1" sx={{ color: drokexColors.dark, fontWeight: 600 }}>
              {p.price != null ? `$${p.price.toLocaleString()}` : 'Consultar'}
            </Typography>
            <DrokexButton size="small" variant="primary" onClick={() => navigate(`/catalog/${p.id}`)}>
              Ver detalle
            </DrokexButton>
          </Box>
        </DrokexCardContent>
      </DrokexCard>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: drokexColors.light }}>
      <PublicNavbar />

      {/* Header Section with Background Image */}
      <Box sx={{
        minHeight: '65vh',
        backgroundImage: 'url(/assets/catalogo_fondo_2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          zIndex: 1
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '40%',
          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 25%, rgba(0, 0, 0, 0.2) 50%, transparent 100%)',
          zIndex: 1
        }
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography
            variant="h3"
            sx={{
              color: '#c3e6c1',
              fontWeight: 700,
              mb: 4,
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            Catálogo de Productos
          </Typography>

          <Grid container spacing={2} sx={{ maxWidth: '800px' }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Buscar productos, empresas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={onSearchEnter}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                    },
                    borderColor: 'rgba(105, 223, 97, 1)',
                    '&.Mui-focused': {
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                    }
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setPage(1)} sx={{ color: drokexColors.primary }}>
                        <Search />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <Select
                  value={categoryId}
                  onChange={(e) => { setCategoryId(e.target.value as any); setPage(1); }}
                  displayEmpty
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    borderColor: 'rgba(105, 223, 97, 1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    }
                  }}
                >
                  <MenuItem value="" sx={{ color: drokexColors.secondary }}>
                    Categoría
                  </MenuItem>
                  {categories.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Products Section */}
      <DrokexPattern pattern="diagonal" opacity={0.02}>
        <Container maxWidth="lg" sx={{ py: 4 }}>

          <Grid container spacing={3}>
            {products.map((p) => (
              <Grid item xs={12} sm={6} md={4} key={p.id}>
                <ProductCard p={p} />
              </Grid>
            ))}
            {!loading && products.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', color: drokexColors.secondary, py: 6 }}>
                  No se encontraron productos
                </Box>
              </Grid>
            )}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Box>
        </Container>
      </DrokexPattern>

      <PublicFooter />
    </Box>
  );
};

export default Catalog;

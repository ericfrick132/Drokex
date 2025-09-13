import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Grid, Chip, Stack, Avatar, Tooltip, Select, MenuItem, FormControl, InputLabel, Skeleton, Divider, Switch, Pagination, Alert } from '@mui/material';
import { DrokexButton, DrokexCard, DrokexCardContent, DrokexCardActions, DrokexInput } from '../components/common';
import { productsApi, catalogApi } from '../services/api';
import { Product, Category } from '../types';
import { drokexColors } from '../theme/drokexTheme';
import { useNavigate } from 'react-router-dom';
import { Edit, Visibility, Search, Image as ImageIcon } from '@mui/icons-material';

type SortKey = 'newest' | 'name' | 'price-asc' | 'price-desc' | 'stock-desc' | 'active-first';
type StatusFilter = 'all' | 'active' | 'inactive';

const Products: React.FC = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const sortMap: Record<SortKey, { sortBy: string; sortOrder: 'asc' | 'desc' }> = {
        newest: { sortBy: 'CreatedAt', sortOrder: 'desc' },
        name: { sortBy: 'Name', sortOrder: 'asc' },
        'price-asc': { sortBy: 'Price', sortOrder: 'asc' },
        'price-desc': { sortBy: 'Price', sortOrder: 'desc' },
        'stock-desc': { sortBy: 'Stock', sortOrder: 'desc' },
        'active-first': { sortBy: 'IsActive', sortOrder: 'desc' },
      };

      const { sortBy: sb, sortOrder } = sortMap[sortBy];

      const { data } = await productsApi.getProducts({
        page,
        pageSize,
        search: debounced || undefined,
        categoryId: categoryId === '' ? undefined : Number(categoryId),
        minPrice: minPrice === '' ? undefined : Number(minPrice),
        maxPrice: maxPrice === '' ? undefined : Number(maxPrice),
        sortBy: sb,
        sortOrder,
      });
      if (data.data) {
        setItems(data.data.data);
        setTotalPages(data.data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load: categories
  useEffect(() => {
    (async () => {
      try {
        const { data } = await catalogApi.getCategories();
        if (data.data) setCategories(data.data);
      } catch {}
    })();
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch whenever filters/pagination change
  useEffect(() => {
    setPage(1); // reset page on filter/sort/search changes
  }, [debounced, sortBy, categoryId, minPrice, maxPrice, status]);

  useEffect(() => {
    load();
  }, [page, pageSize, debounced, sortBy, categoryId, minPrice, maxPrice]);

  const toggleActive = async (p: Product) => {
    try {
      await productsApi.updateProduct(p.id, {
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        categoryId: undefined,
        isFeatured: p.isFeatured,
        isActive: !p.isActive,
      } as any);
      await load();
    } catch {}
  };

  // ----- Import / Export (CSV compatible con Excel) -----
  const downloadTemplate = () => {
    const headers = ['Name','Description','Price','Stock','Category','IsFeatured'];
    const sample1 = ['Café Especial', 'Café tostado premium 500g', '12.5', '100', 'Café', 'true'];
    const sample2 = ['Artesanía Textil', 'Tejido artesanal', '45', '20', 'Textiles', 'false'];
    const csv = [headers.join(','), sample1.join(','), sample2.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drokex_products_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const openImportDialog = () => {
    setImportResult(null);
    fileInputRef.current?.click();
  };

  const parseCsvLine = (line: string, expected: number): string[] | null => {
    const tryDelims = [',',';'];
    for (const d of tryDelims) {
      const parts = line.split(d).map(s => s.trim());
      if (parts.length === expected) return parts;
    }
    return null;
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0);
      if (lines.length < 2) {
        setImportResult({ created: 0, failed: 0, errors: ['El archivo está vacío o sin filas de datos.'] });
        return;
      }
      const header = lines[0];
      const headerParts = parseCsvLine(header, 6);
      if (!headerParts) {
        setImportResult({ created: 0, failed: 0, errors: ['Encabezado inválido. Se esperan 6 columnas: Name,Description,Price,Stock,Category,IsFeatured'] });
        return;
      }
      const cols = headerParts.map(h => h.toLowerCase());
      const expected = ['name','description','price','stock','category','isfeatured'];
      const okCols = expected.every((c, idx) => cols[idx] === c);
      if (!okCols) {
        setImportResult({ created: 0, failed: 0, errors: ['Encabezado inválido. Debe ser: Name,Description,Price,Stock,Category,IsFeatured'] });
        return;
      }

      let created = 0, failed = 0; const errors: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i], 6);
        if (!row) { failed++; errors.push(`Línea ${i+1}: columnas inválidas`); continue; }
        const [name, description, priceStr, stockStr, categoryName, isFeaturedStr] = row;
        if (!name) { failed++; errors.push(`Línea ${i+1}: Name requerido`); continue; }
        const price = Number(priceStr);
        const stock = Number(stockStr);
        if (Number.isNaN(price) || Number.isNaN(stock)) { failed++; errors.push(`Línea ${i+1}: Price/Stock inválidos`); continue; }
        const category = categories.find(c => c.name.toLowerCase() === (categoryName||'').toLowerCase());
        const categoryIdVal = category ? category.id : undefined;
        const isFeatured = /^(true|1|si|sí|yes)$/i.test(isFeaturedStr);
        try {
          await productsApi.createProduct({ name, description, price, stock, categoryId: categoryIdVal, isFeatured });
          created++;
        } catch (err: any) {
          failed++;
          const msg = err?.response?.data?.message || 'Error creando producto';
          errors.push(`Línea ${i+1}: ${msg}`);
        }
      }
      setImportResult({ created, failed, errors });
      await load();
    } finally {
      setImporting(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    // Backend sorts; we only apply status filter client-side if needed
    let list = [...items];
    if (status !== 'all') list = list.filter(x => (status === 'active' ? x.isActive : !x.isActive));
    return list;
  }, [items, status]);

  const primaryImage = (p: Product): string | undefined => {
    if (!p.images || p.images.length === 0) return undefined;
    const primary = p.images.find((i) => i.isPrimary) || p.images[0];
    return primary?.imageUrl || undefined;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2.5, md: 4 } }}>
        <Box>
          <Typography variant="h5" sx={{ color: drokexColors.dark, fontWeight: 700 }}>Mis Productos</Typography>
          <Typography variant="body2" sx={{ color: drokexColors.secondary, mt: 0.5 }}>
            Administra tu catálogo, visibilidad y precios
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.25}>
          <Box sx={{ display: { xs: 'none', md: 'inline-block' } }}>
            <DrokexButton variant="outline" onClick={downloadTemplate}>Descargar plantilla (CSV)</DrokexButton>
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'inline-block' } }}>
            <DrokexButton variant="secondary" onClick={openImportDialog} loading={importing}>Importar CSV</DrokexButton>
          </Box>
          <DrokexButton variant="primary" onClick={() => navigate('/products/new')}>Añadir Producto</DrokexButton>
        </Stack>
      </Box>

      {importResult && (
        <Alert severity={importResult.failed === 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
          Importación finalizada: {importResult.created} creados, {importResult.failed} con error.
          {importResult.errors.length > 0 && (
            <>
              <br />
              Detalles: {importResult.errors.slice(0, 3).join(' | ')}{importResult.errors.length > 3 ? '…' : ''}
            </>
          )}
        </Alert>
      )}

      <input ref={fileInputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleImportFile} />

      {/* Toolbar */}
      <Box sx={{ mb: { xs: 2.5, md: 3.5 } }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ xs: 'stretch', lg: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <DrokexInput
              placeholder="Buscar por nombre..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              icon={<Search sx={{ color: drokexColors.secondary }} />}
            />
          </Box>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', lg: 220 } }}>
            <InputLabel id="category-label">Categoría</InputLabel>
            <Select
              labelId="category-label"
              label="Categoría"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value as number | '')}
            >
              <MenuItem value="">Todas</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <DrokexInput
            type="number"
            placeholder="Precio mín."
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ width: { xs: '100%', lg: 160 } }}
          />
          <DrokexInput
            type="number"
            placeholder="Precio máx."
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ width: { xs: '100%', lg: 160 } }}
          />
        </Stack>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', lg: 'center' }} justifyContent="space-between" sx={{ mt: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label="Todos" onClick={() => setStatus('all')} color={status === 'all' ? 'secondary' : undefined} variant={status === 'all' ? 'filled' : 'outlined'} sx={{ fontWeight: 600 }} />
            <Chip label="Activos" onClick={() => setStatus('active')} color={status === 'active' ? 'secondary' : undefined} variant={status === 'active' ? 'filled' : 'outlined'} sx={{ fontWeight: 600 }} />
            <Chip label="Inactivos" onClick={() => setStatus('inactive')} color={status === 'inactive' ? 'secondary' : undefined} variant={status === 'inactive' ? 'filled' : 'outlined'} sx={{ fontWeight: 600 }} />
          </Stack>
          <Box sx={{ width: { xs: '100%', lg: 'auto' } }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="sort-label">Ordenar por</InputLabel>
              <Select labelId="sort-label" label="Ordenar por" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}>
              <MenuItem value={'newest'}>Más recientes</MenuItem>
              <MenuItem value={'name'}>Nombre (A–Z)</MenuItem>
              <MenuItem value={'price-asc'}>Precio: menor a mayor</MenuItem>
              <MenuItem value={'price-desc'}>Precio: mayor a menor</MenuItem>
              <MenuItem value={'stock-desc'}>Stock: mayor a menor</MenuItem>
              <MenuItem value={'active-first'}>Activos primero</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Stack>
      </Box>

      {/* Content */}
      {loading ? (
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mt: 1 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <DrokexCard>
                <Skeleton variant="rectangular" sx={{ height: { xs: 140, sm: 180 } }} />
                <DrokexCardContent sx={{ p: 2.5 }}>
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="60%" />
                </DrokexCardContent>
                <DrokexCardActions sx={{ px: 2.5, py: 1.5 }}>
                  <Skeleton variant="rounded" width={80} height={36} />
                </DrokexCardActions>
              </DrokexCard>
            </Grid>
          ))}
        </Grid>
      ) : filteredAndSorted.length > 0 ? (
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mt: 1 }}>
          {filteredAndSorted.map((p) => {
            const img = primaryImage(p);
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
                <DrokexCard variant="elevated">
                  {/* Cover with status overlay */}
                  <Box sx={{ position: 'relative', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: { xs: 160, sm: 200 },
                        backgroundColor: img ? '#f5f5f5' : drokexColors.light,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {img ? (
                        <Box component="img" src={img} alt={p.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Avatar sx={{ bgcolor: drokexColors.pale, width: 64, height: 64 }}>
                          <ImageIcon sx={{ color: drokexColors.secondary }} />
                        </Avatar>
                      )}
                    </Box>
                    <Chip
                      size="small"
                      label={p.isActive ? 'Activo' : 'Inactivo'}
                      color={p.isActive ? 'primary' : 'default'}
                      sx={{ position: 'absolute', top: 8, left: 8, fontWeight: 600 }}
                    />
                  </Box>
                  <DrokexCardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: drokexColors.dark, mb: 0.75 }} noWrap>
                      {p.name}
                    </Typography>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6" sx={{ m: 0, fontWeight: 700, color: drokexColors.dark }}>
                        {p.price != null ? `$${p.price.toLocaleString()}` : '—'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: drokexColors.secondary, fontWeight: 600 }}>
                        Stock: {p.stock ?? 0}
                      </Typography>
                    </Stack>
                  </DrokexCardContent>

                  <Divider />

                  <DrokexCardActions sx={{ px: 2.5, py: 1.5 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ width: '100%', alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}>
                      <Stack direction="row" spacing={1.25} sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                        <DrokexButton variant="secondary" onClick={() => navigate(`/products/${p.id}/edit`)} startIcon={<Edit />}>
                          Editar
                        </DrokexButton>
                        <DrokexButton variant="outline" onClick={() => navigate(`/catalog/${p.id}`)} startIcon={<Visibility />}>
                          Ver
                        </DrokexButton>
                      </Stack>
                      <Tooltip title={p.isActive ? 'Desactivar' : 'Activar'}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Switch
                            checked={p.isActive}
                            onChange={() => toggleActive(p)}
                            color="secondary"
                          />
                        </Stack>
                      </Tooltip>
                    </Stack>
                  </DrokexCardActions>
                </DrokexCard>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Box sx={{
          textAlign: 'center',
          color: drokexColors.secondary,
          py: 8,
          mt: 2,
          backgroundColor: '#fff',
          borderRadius: 2,
          border: `2px dashed ${drokexColors.pale}`,
        }}>
          <Typography variant="h6" sx={{ mb: 1, color: drokexColors.dark, fontWeight: 700 }}>
            Aún no tienes productos
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Crea tu primer producto para comenzar a vender en el marketplace.
          </Typography>
          <DrokexButton variant="primary" onClick={() => navigate('/products/new')}>Crear producto</DrokexButton>
        </Box>
      )}

      {/* Pagination */}
      {!loading && filteredAndSorted.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3.5 }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel id="page-size-label">Por página</InputLabel>
            <Select
              labelId="page-size-label"
              label="Por página"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {[8, 12, 16, 24, 32].map((n) => (
                <MenuItem key={n} value={n}>{n}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Pagination
            count={totalPages}
            page={page}
            color="primary"
            onChange={(_, p) => setPage(p)}
          />
        </Box>
      )}
    </Box>
  );
};

export default Products;

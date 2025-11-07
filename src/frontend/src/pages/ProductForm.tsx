import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography, Checkbox, FormControlLabel, IconButton, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { DrokexButton, DrokexCard, DrokexCardContent, DrokexInput } from '../components/common';
import { catalogApi, productsApi, imagesApi, categoriesApi } from '../services/api';
import { Category, Product, ProductImage } from '../types';
import { drokexColors } from '../theme/drokexTheme';
import { Delete, Star, StarBorder } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const ProductForm: React.FC = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    categoryId: undefined as number | undefined,
    isFeatured: false,
    isActive: true,
  });
  const [images, setImages] = useState<ProductImage[]>([]);
  const [imageError, setImageError] = useState<string>('');
  // For new product flow: allow pre-selecting images before creating
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    const loadCats = async () => {
      try { const { data } = await catalogApi.getCategories(); if (!cancelled && data.data) setCategories(data.data); } catch {}
    };
    loadCats();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadProduct = async () => {
      if (!isEdit || !id) return;
      try {
        const { data } = await productsApi.getProduct(parseInt(id, 10));
        const p: Product | undefined = data.data as any;
        if (!cancelled && p) {
          setForm({
            name: p.name,
            description: p.description,
            price: p.price ?? 0,
            stock: p.stock ?? 0,
            categoryId: undefined,
            isFeatured: p.isFeatured,
            isActive: p.isActive,
          });
          setImages(p.images || []);
        }
      } catch {}
    };
    loadProduct();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  const updateField = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const validate = () => {
    const e: any = {};
    if (!form.name.trim()) e.name = 'Nombre requerido';
    if (!form.description.trim()) e.description = 'Descripción requerida';
    if (form.price < 0) e.price = 'Precio inválido';
    if (form.stock < 0) e.stock = 'Stock inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEdit && id) {
        await productsApi.updateProduct(parseInt(id, 10), {
          name: form.name,
          description: form.description,
          price: form.price,
          stock: form.stock,
          categoryId: form.categoryId,
          isFeatured: form.isFeatured,
          isActive: form.isActive,
        } as any);
      } else {
        const { data } = await productsApi.createProduct({
          name: form.name,
          description: form.description,
          price: form.price,
          stock: form.stock,
          categoryId: form.categoryId,
          isFeatured: form.isFeatured,
        });
        const created: Product | undefined = (data as any).data;
        if (created?.id) {
          // If user pre-selected images, upload them now
          for (let i = 0; i < pendingFiles.length; i++) {
            const f = pendingFiles[i];
            try {
              const up = await imagesApi.upload(f);
              const url = (up as any).data?.data as string;
              await productsApi.addImage(created.id, {
                imageUrl: url,
                isPrimary: i === 0,
                displayOrder: i,
                mimeType: f.type,
                fileSizeBytes: f.size,
              });
            } catch {}
          }
          navigate(`/products/${created.id}/edit`);
          return; // early exit
        }
      }
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validación de tamaño y tipo en frontend
    const MAX_MB = 5;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setImageError('Formato inválido. Usa JPG, PNG o WEBP.');
      (e.target as HTMLInputElement).value = '';
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setImageError(`La imagen excede ${MAX_MB}MB.`);
      (e.target as HTMLInputElement).value = '';
      return;
    }
    try {
      setImageError('');
      if (isEdit && id) {
        // Immediate upload in edit mode
        const { data } = await imagesApi.upload(file);
        const url = (data as any).data as string;
        const first = images.length === 0;
        const { data: upd } = await productsApi.addImage(parseInt(id, 10), {
          imageUrl: url,
          isPrimary: first,
          displayOrder: images.length
        });
        if (upd.data?.images) setImages(upd.data.images);
      } else {
        // Queue locally for new product flow
        setPendingFiles(prev => [...prev, file]);
        const url = URL.createObjectURL(file);
        setPendingPreviews(prev => [...prev, url]);
      }
    } catch {}
    finally {
      // reset input to allow same file reselect
      (e.target as HTMLInputElement).value = '';
    }
  };

  const setPrimary = async (imageId: number) => {
    if (!isEdit || !id) return;
    const { data } = await productsApi.setPrimaryImage(parseInt(id, 10), imageId);
    if (data.data?.images) setImages(data.data.images);
  };

  const deleteImage = async (imageId: number) => {
    if (!isEdit || !id) return;
    const { data } = await productsApi.deleteImage(parseInt(id, 10), imageId);
    if (data.data?.images) setImages(data.data.images);
  };

  return (
    <DrokexCard variant="elevated">
      <DrokexCardContent>
        <Typography variant="h6" sx={{ color: drokexColors.dark, fontWeight: 600, mb: 2 }}>
          {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <DrokexInput label="Nombre" value={form.name} onChange={(e) => updateField('name', e.target.value)} error={!!errors.name} helperText={errors.name} />
          </Grid>
          <Grid item xs={12}>
            <DrokexInput label="Descripción" multiline rows={4} value={form.description} onChange={(e) => updateField('description', e.target.value)} error={!!errors.description} helperText={errors.description} />
          </Grid>
          <Grid item xs={12} md={6}>
            <DrokexInput label="Precio" type="number" value={form.price} onChange={(e) => updateField('price', Number(e.target.value))} error={!!errors.price} helperText={errors.price} />
          </Grid>
          <Grid item xs={12} md={6}>
            <DrokexInput label="Stock" type="number" value={form.stock} onChange={(e) => updateField('stock', Number(e.target.value))} error={!!errors.stock} helperText={errors.stock} />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="cat-label">Categoría</InputLabel>
              <Select
                labelId="cat-label"
                label="Categoría"
                value={form.categoryId ?? ''}
                onChange={(e) => updateField('categoryId', e.target.value === '' ? undefined : (e.target.value as number))}
              >
                <MenuItem value="">Sin categoría</MenuItem>
                {categories.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {(user?.role === 'Admin' || user?.role === 'SuperAdmin') && (
              <Box sx={{ mt: 1 }}>
                <DrokexButton variant="ghost" onClick={async () => {
                  const name = prompt('Nueva categoría');
                  if (!name) return;
                  try { await categoriesApi.create({ name }); const { data } = await catalogApi.getCategories(); if (data.data) setCategories(data.data); } catch {}
                }}>+ Nueva categoría</DrokexButton>
              </Box>
            )}
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={<Checkbox checked={form.isFeatured} onChange={(e) => updateField('isFeatured', e.target.checked)} />} label="Destacar producto" />
          </Grid>
          {(
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ color: drokexColors.dark, fontWeight: 600, mb: 1 }}>
                Imágenes
              </Typography>
              {isEdit ? (
                <>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {images.map(img => (
                      <Box key={img.id} sx={{ position: 'relative', width: 120, height: 90, borderRadius: 2, overflow: 'hidden', border: '1px solid #eee' }}>
                        <Box component="img" src={img.imageUrl} alt="img" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <Box sx={{ position: 'absolute', top: 2, left: 2, display: 'flex', gap: 1 }}>
                          <IconButton size="small" onClick={() => setPrimary(img.id)} title="Marcar como principal" sx={{ bgcolor: '#fff' }}>
                            {img.isPrimary ? <Star sx={{ color: '#f59e0b' }} /> : <StarBorder />}
                          </IconButton>
                        </Box>
                        <Box sx={{ position: 'absolute', top: 2, right: 2 }}>
                          <IconButton size="small" onClick={() => deleteImage(img.id)} title="Eliminar" sx={{ bgcolor: '#fff' }}>
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {pendingPreviews.map((src, idx) => (
                      <Box key={idx} sx={{ position: 'relative', width: 120, height: 90, borderRadius: 2, overflow: 'hidden', border: '1px solid #eee' }}>
                        <Box component="img" src={src} alt="img" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                    ))}
                  </Box>
                </>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DrokexButton component="label" variant="outline">
                  Subir Imagen
                  <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFileChange} />
                </DrokexButton>
                {imageError && (
                  <Typography variant="body2" color="error">{imageError}</Typography>
                )}
              </Box>
            </Grid>
          )}
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
          <DrokexButton variant="ghost" onClick={() => navigate('/products')} disabled={loading}>Cancelar</DrokexButton>
          <DrokexButton variant="primary" onClick={handleSubmit} loading={loading}>{isEdit ? 'Guardar Cambios' : 'Crear Producto'}</DrokexButton>
        </Box>
      </DrokexCardContent>
    </DrokexCard>
  );
};

export default ProductForm;

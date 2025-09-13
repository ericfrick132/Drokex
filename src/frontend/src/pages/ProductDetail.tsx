import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Grid, Typography, Chip } from '@mui/material';
import PublicNavbar from '../components/layout/PublicNavbar';
import { DrokexCard, DrokexCardContent, DrokexButton, DrokexPattern } from '../components/common';
import { catalogApi, productsApi } from '../services/api';
import { Product } from '../types';
import { drokexColors } from '../theme/drokexTheme';
import { useAuth } from '../contexts/AuthContext';

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) return;
      try {
        const { data } = await catalogApi.getProduct(parseInt(id, 10));
        if (!cancelled && data.data) {
          setProduct(data.data);
          setCurrentIndex(0);
        }
        // registrar vista (no bloqueante)
        try { await (await import('../services/api')).default.post(`/catalog/products/${id}/view`); } catch {}
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const images = product?.images || [];
  const cover = images[currentIndex]?.imageUrl || '';
  const goPrev = () => setCurrentIndex((i) => (images.length ? (i - 1 + images.length) % images.length : 0));
  const goNext = () => setCurrentIndex((i) => (images.length ? (i + 1) % images.length : 0));
  const canDelete = !!user && !!product && user.companyId === product.companyId;

  const handleDelete = async () => {
    if (!product || !canDelete || deleting) return;
    const ok = window.confirm('¿Eliminar este producto? Esta acción no se puede deshacer.');
    if (!ok) return;
    try {
      setDeleting(true);
      await productsApi.deleteProduct(product.id);
      navigate('/products');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'No se pudo eliminar el producto');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DrokexPattern pattern="diagonal" opacity={0.02}>
      <Box sx={{ minHeight: '100vh', backgroundColor: drokexColors.light }}>
        <PublicNavbar />
        <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
          {/* Mobile back button */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, mb: 2 }}>
            <DrokexButton variant="outline" onClick={() => navigate(-1)}>
              Volver
            </DrokexButton>
          </Box>
          {!product ? (
            <Typography sx={{ color: drokexColors.secondary }}>Cargando producto...</Typography>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <DrokexCard variant="elevated">
                  <DrokexCardContent>
                    <Box sx={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 2, backgroundColor: '#f7f7f7' }}>
                      <Box sx={{ width: '100%', pt: '75%', position: 'relative' }}>
                        {cover ? (
                          <Box component="img" src={cover} alt={product.name} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: drokexColors.secondary }}>
                            Sin imagen
                          </Box>
                        )}
                      </Box>
                      {images.length > 1 && (
                        <>
                          <Box component="button" onClick={goPrev} aria-label="prev" sx={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: 'white', border: 0, borderRadius: '50%', width: 36, height: 36, cursor: 'pointer' }}>&lt;</Box>
                          <Box component="button" onClick={goNext} aria-label="next" sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: 'white', border: 0, borderRadius: '50%', width: 36, height: 36, cursor: 'pointer' }}>&gt;</Box>
                        </>
                      )}
                    </Box>
                    {images.length > 1 && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, overflowX: 'auto' }}>
                        {images.map((img, idx) => (
                          <Box
                            key={img.id}
                            component="img"
                            src={img.imageUrl}
                            alt="thumb"
                            onClick={() => setCurrentIndex(idx)}
                            sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1, cursor: 'pointer', outline: idx === currentIndex ? `2px solid ${drokexColors.primary}` : 'none' }}
                          />
                        ))}
                      </Box>
                    )}
                  </DrokexCardContent>
                </DrokexCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h4" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 1 }}>
                  {product.name}
                </Typography>
                {product.categoryName && (
                  <Chip label={product.categoryName} size="small" sx={{ mb: 2 }} />
                )}
                <Typography variant="h6" sx={{ color: drokexColors.dark, fontWeight: 600, mb: 2 }}>
                  {product.price != null ? `$${product.price.toLocaleString()}` : 'Consultar precio'}
                </Typography>
                <Typography variant="body1" sx={{ color: drokexColors.secondary, mb: 3 }}>
                  {product.description}
                </Typography>

                <DrokexCard variant="elevated">
                  <DrokexCardContent>
                    <Typography variant="subtitle1" sx={{ color: drokexColors.dark, fontWeight: 600, mb: 1 }}>
                      Empresa Proveedora
                    </Typography>
                    <Typography variant="body2" sx={{ color: drokexColors.dark }}>
                      {product.companyName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: drokexColors.secondary }}>
                      Email: {product.companyContactEmail} • Tel: {product.companyPhone}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <DrokexButton variant="primary">Contactar</DrokexButton>
                      {canDelete && (
                        <DrokexButton
                          variant="outline"
                          onClick={handleDelete}
                          loading={deleting}
                          sx={{ borderColor: '#f44336', color: '#f44336' }}
                        >
                          Eliminar
                        </DrokexButton>
                      )}
                    </Box>
                  </DrokexCardContent>
                </DrokexCard>
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>
    </DrokexPattern>
  );
};

export default ProductDetail;

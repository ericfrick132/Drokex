import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Grid, Typography, Chip } from '@mui/material';
import PublicNavbar from '../components/layout/PublicNavbar';
import PublicFooter from '../components/layout/PublicFooter';
import { DrokexCard, DrokexCardContent, DrokexButton, DrokexPattern } from '../components/common';
import { catalogApi, companiesApi } from '../services/api';
import { Company, Product } from '../types';
import { drokexColors } from '../theme/drokexTheme';

const CompanyPublic: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) return;
      try {
        const [cRes, pRes] = await Promise.all([
          companiesApi.getCompany(parseInt(id, 10)),
          catalogApi.getProducts({ companyId: parseInt(id, 10), page: 1, pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' })
        ]);
        if (!cancelled) {
          if (cRes.data.data) setCompany(cRes.data.data);
          if (pRes.data.data?.data) setProducts(pRes.data.data.data);
        }
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

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

          {!company ? (
            <Typography sx={{ color: drokexColors.secondary }}>Cargando empresa…</Typography>
          ) : (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 1 }}>
                  {company.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip size="small" label={company.isApproved ? 'Aprobada' : 'Pendiente'} color={company.isApproved ? 'primary' : 'default'} />
                  <Chip size="small" label={`${company.productsCount} productos`} />
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                  <DrokexCard variant="elevated">
                    <DrokexCardContent>
                      <Typography variant="subtitle1" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 1 }}>
                        Acerca de la empresa
                      </Typography>
                      <Typography variant="body2" sx={{ color: drokexColors.secondary, mb: 2 }}>
                        {company.description || 'Sin descripción'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {company.website && (
                          <DrokexButton variant="outline" onClick={() => window.open(company.website, '_blank')}>Sitio web</DrokexButton>
                        )}
                        {company.contactEmail && (
                          <DrokexButton variant="primary" onClick={() => window.location.href = `mailto:${company.contactEmail}`}>Contactar</DrokexButton>
                        )}
                      </Box>
                    </DrokexCardContent>
                  </DrokexCard>
                </Grid>

                <Grid item xs={12} md={7}>
                  <Typography variant="h6" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 1.5 }}>
                    Productos publicados
                  </Typography>
                  <Grid container spacing={2}>
                    {products.map((p) => {
                      const cover = p.images?.[0]?.imageUrl || '';
                      return (
                        <Grid item xs={12} sm={6} key={p.id}>
                          <DrokexCard variant="interactive">
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
                              <Typography variant="subtitle1" sx={{ color: drokexColors.dark, fontWeight: 700, mb: 0.5 }}>
                                {p.name}
                              </Typography>
                              <Typography variant="body2" sx={{ color: drokexColors.secondary, mb: 1 }}>
                                {p.price != null ? `$${p.price.toLocaleString()}` : 'Consultar'}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <DrokexButton size="small" variant="primary" onClick={() => navigate(`/catalog/${p.id}`)}>
                                  Ver detalle
                                </DrokexButton>
                              </Box>
                            </DrokexCardContent>
                          </DrokexCard>
                        </Grid>
                      );
                    })}
                    {products.length === 0 && (
                      <Grid item xs={12}>
                        <Box sx={{ color: drokexColors.secondary }}>La empresa aún no tiene productos públicos.</Box>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </>
          )}
        </Container>
        <PublicFooter />
      </Box>
    </DrokexPattern>
  );
};

export default CompanyPublic;

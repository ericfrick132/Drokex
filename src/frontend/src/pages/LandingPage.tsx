import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  TextField,
  Alert,
  Paper,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Business,
  Public,
  TrendingUp,
  Security,
  Speed,
  Support,
  CheckCircle,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';
import { leadsApi, tenantsApi, geoApi } from '../services/api';
import { 
  DrokexLogo, 
  DrokexButton, 
  DrokexInput, 
  DrokexCard, 
  DrokexCardContent,
  DrokexCardActions,
  DrokexPattern 
} from '../components/common';
import { drokexColors } from '../theme/drokexTheme';
import PublicNavbar from '../components/layout/PublicNavbar';
import PublicFooter from '../components/layout/PublicFooter';
import BitsReveal from '../components/bits/BitsReveal';
import BitsParallax from '../components/bits/BitsParallax';
import BitsTilt from '../components/bits/BitsTilt';

interface LeadFormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  interestedProducts: string;
  message: string;
}

const LandingPage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const benefitsRef = useRef<HTMLDivElement | null>(null);
  const featuresRef = useRef<HTMLDivElement | null>(null);
  const leadFormRef = useRef<HTMLDivElement | null>(null);
  const [leadForm, setLeadForm] = useState<LeadFormData>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    interestedProducts: '',
    message: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { tenant, getCountryFlag } = useTenant();
  const [heroTitle, setHeroTitle] = useState('Conectando Empresas de LATAM con el Mundo');
  const [heroSubtitle, setHeroSubtitle] = useState('La plataforma que facilita la expansión comercial de empresas latinoamericanas hacia mercados internacionales, sin necesidad de presencia física.');
  const [heroCTA, setHeroCTA] = useState('Registrar mi Empresa');
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | undefined>(undefined);
  const [heroVideoPoster, setHeroVideoPoster] = useState<string | undefined>(undefined);
  const [coverage, setCoverage] = useState<{ countryCode: string; country: string; tenants: number }[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await tenantsApi.getCms();
        const cms = data.data || {};
        if (cms.heroTitle) setHeroTitle(cms.heroTitle);
        if (cms.heroSubtitle) setHeroSubtitle(cms.heroSubtitle);
        if (cms.ctaText) setHeroCTA(cms.ctaText);
        if (cms.heroVideoUrl) setHeroVideoUrl(cms.heroVideoUrl);
        if (cms.heroVideoPoster) setHeroVideoPoster(cms.heroVideoPoster);
      } catch {}
    })();
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await geoApi.getCoverage();
        setCoverage(data?.data || []);
      } catch {}
    })();
  }, []);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!leadForm.companyName.trim()) {
      newErrors.companyName = 'El nombre de la empresa es requerido';
    }

    if (!leadForm.contactName.trim()) {
      newErrors.contactName = 'El nombre de contacto es requerido';
    }

    if (!leadForm.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(leadForm.email)) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }

    if (!leadForm.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Integración real con API de Leads
      await leadsApi.createLead({
        companyName: leadForm.companyName,
        contactName: leadForm.contactName,
        email: leadForm.email,
        phone: leadForm.phone,
        message: leadForm.message,
      });
      setSubmitSuccess(true);
      setLeadForm({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        interestedProducts: '',
        message: '',
      });
    } catch (error) {
      console.error('Error submitting lead:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof LeadFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLeadForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const benefits = [
    {
      icon: <Public sx={{ color: drokexColors.primary }} />,
      title: 'Expansión Internacional',
      description: 'Conecta con compradores de todo el mundo sin necesidad de presencia física',
    },
    {
      icon: <Business sx={{ color: drokexColors.secondary }} />,
      title: 'Gestión Simplificada',
      description: 'Administra tu inventario, órdenes y pagos desde una sola plataforma',
    },
    {
      icon: <TrendingUp sx={{ color: drokexColors.primary }} />,
      title: 'Crecimiento Escalable',
      description: 'Crece a tu propio ritmo con planes que se adaptan a tu negocio',
    },
    {
      icon: <Security sx={{ color: drokexColors.secondary }} />,
      title: 'Transacciones Seguras',
      description: 'Pagos procesados de forma segura con protección para compradores y vendedores',
    },
    {
      icon: <Speed sx={{ color: drokexColors.primary }} />,
      title: 'Configuración Rápida',
      description: 'Empieza a vender en menos de 24 horas con nuestra configuración simplificada',
    },
    {
      icon: <Support sx={{ color: drokexColors.secondary }} />,
      title: 'Soporte Especializado',
      description: 'Equipo dedicado que entiende el mercado LATAM y sus particularidades',
    },
  ];

  const features = [
    'Catálogo de productos con múltiples imágenes',
    'Sistema de gestión de inventarios',
    'Procesamiento de pagos internacionales',
    'Dashboard con estadísticas en tiempo real',
    'Soporte para múltiples monedas',
    'Integración con sistemas logísticos',
    'Herramientas de marketing digital',
    'API para integraciones personalizadas',
  ];

  // Animations are now driven by react-bits components only.

  return (
    <Box sx={{ backgroundColor: drokexColors.light, minHeight: '100vh' }}>
      {/* Public Navbar consistent with brand */}
      <PublicNavbar />
      {/* Hero Section con Degradado y video opcional */}
      <Box sx={{ position: 'relative' }}>
        {heroVideoUrl && (
          <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
            <Box component="video" src={heroVideoUrl} poster={heroVideoPoster} autoPlay muted loop playsInline preload="metadata" sx={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }} />
          </Box>
        )}
        <DrokexPattern pattern="gradient" opacity={heroVideoUrl ? 0.4 : 1}>
        <Container maxWidth="lg" sx={{ pt: 8, pb: 10, textAlign: 'center', position: 'relative', zIndex: 1 }} ref={heroRef}>
          <Box sx={{ position: 'relative', mb: 4 }} className="lp-hero-logo">
            <BitsParallax strength={24} sx={{ position: 'absolute', top: -16, left: '15%', zIndex: 0, opacity: 0.18 }}>
              <Box sx={{ width: 120, height: 120, borderRadius: '50%', background: 'white' }} />
            </BitsParallax>
            <BitsParallax strength={-16} sx={{ position: 'absolute', top: -8, right: '18%', zIndex: 0, opacity: 0.18 }}>
              <Box sx={{ width: 80, height: 80, borderRadius: 2, background: 'white', transform: 'rotate(12deg)' }} />
            </BitsParallax>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <DrokexLogo variant="full" size="large" color="white" />
            </Box>
          </Box>

          {(() => {
            const country = tenant?.country;
            const currencyLabel = tenant?.currencySymbol || tenant?.currency;
            if (!country || !currencyLabel) return null;
            return (
              <Tooltip title={`Región del marketplace y su moneda (${currencyLabel})`}>
                <Chip
                  label={`${getCountryFlag()} ${country} • Moneda: ${currencyLabel}`}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    mb: 3,
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                  className="lp-hero-chip"
                />
              </Tooltip>
            );
          })()}

          <Typography
            variant="h2"
            sx={{
              color: 'white',
              mb: 3,
              fontWeight: 400,
              fontSize: { xs: '2rem', md: '3rem' },
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
            className="lp-hero-title"
          >
            {heroTitle}
          </Typography>

          <Typography
            variant="h5"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              mb: 4,
              fontWeight: 400,
              lineHeight: 1.6,
              maxWidth: '800px',
              mx: 'auto',
            }}
            className="lp-hero-subtitle"
          >
            {heroSubtitle}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }} className="lp-hero-cta">
            <BitsTilt>
              <DrokexButton
                variant="primary"
                size="large"
                onClick={() => navigate('/register')}
                sx={{ fontSize: '1.1rem', px: 4, py: 1.5, backgroundColor: 'white', color: drokexColors.primary }}
              >
                Quiero vender (Proveedor)
              </DrokexButton>
            </BitsTilt>

            <BitsTilt>
              <DrokexButton
                variant="outline"
                size="large"
                onClick={() => navigate('/catalog')}
                sx={{ fontSize: '1.1rem', px: 4, py: 1.5, borderColor: 'white', color: 'white' }}
              >
                Buscar Proveedores
              </DrokexButton>
            </BitsTilt>

            <BitsTilt>
              <DrokexButton
                variant="ghost"
                size="large"
                onClick={() => navigate('/signup')}
                sx={{ fontSize: '1.1rem', px: 4, py: 1.5, color: 'white' }}
              >
                Registrarme como Comprador
              </DrokexButton>
            </BitsTilt>
          </Box>

          {/* Buscador rápido en el hero */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Paper
              component="form"
              onSubmit={(e: any) => {
                e.preventDefault();
                const v = (e.target?.query?.value || '').trim();
                navigate(`/catalog${v ? `?search=${encodeURIComponent(v)}` : ''}`);
              }}
              sx={{
                p: 1,
                display: 'flex',
                alignItems: 'center',
                width: { xs: '100%', sm: 520 },
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderRadius: 3,
              }}
            >
              <TextField
                name="query"
                placeholder="Buscar productos o empresas…"
                variant="standard"
                fullWidth
                InputProps={{ disableUnderline: true, sx: { px: 1 } }}
              />
              <DrokexButton type="submit" variant="primary" sx={{ ml: 1 }}>Buscar</DrokexButton>
            </Paper>
          </Box>
        </Container>
        </DrokexPattern>
      </Box>

      {/* Sección de Beneficios */}
      <Container id="beneficios" maxWidth="lg" sx={{ py: 8 }} ref={benefitsRef}>
        <Typography
          variant="h3"
          sx={{
            textAlign: 'center',
            mb: 2,
            color: drokexColors.dark,
            fontWeight: 400,
          }}
        >
          ¿Por qué elegir Drokex?
        </Typography>

        <Typography
          variant="body1"
          sx={{
            textAlign: 'center',
            mb: 6,
            color: drokexColors.secondary,
            fontSize: '1.1rem',
            maxWidth: '600px',
            mx: 'auto',
          }}
        >
          Ofrecemos todo lo que necesitas para expandir tu negocio internacionalmente
        </Typography>

        <Grid container spacing={4}>
          {benefits.map((benefit, index) => (
            <Grid item xs={12} md={6} key={index} className="lp-benefit">
              <BitsReveal effect="up">
                <BitsTilt>
                  <DrokexCard variant="interactive" sx={{ height: '100%' }}>
                    <DrokexCardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ mt: 1 }}>
                          {benefit.icon}
                        </Box>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              color: drokexColors.dark,
                              fontWeight: 400,
                              mb: 1,
                            }}
                          >
                            {benefit.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: drokexColors.secondary }}
                          >
                            {benefit.description}
                          </Typography>
                        </Box>
                      </Box>
                    </DrokexCardContent>
                  </DrokexCard>
                </BitsTilt>
              </BitsReveal>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Cobertura */}
      <DrokexPattern pattern="diagonal" opacity={0.03}>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h4" sx={{ textAlign: 'center', mb: 2, color: drokexColors.dark, fontWeight: 500 }}>Países donde operamos</Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', mb: 4, color: drokexColors.secondary }}>Construimos una red regional de marketplaces por país</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
            {coverage.map(c => (
              <Chip key={c.countryCode} label={`${c.country} (${c.tenants})`} />
            ))}
            {coverage.length === 0 && (
              <Typography variant="body2" sx={{ color: drokexColors.secondary }}>
                Próximamente mostraremos cobertura por país.
              </Typography>
            )}
          </Box>
        </Container>
      </DrokexPattern>

      {/* Sección de Características */}
      <Box sx={{ backgroundColor: 'white', py: 8 }}>
        <Container maxWidth="lg" ref={featuresRef}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h3"
                sx={{
                  mb: 3,
                  color: drokexColors.dark,
                  fontWeight: 400,
                }}
              >
                Plataforma Completa para tu Éxito
              </Typography>
              
              <Typography
                variant="body1"
                sx={{
                  mb: 4,
                  color: drokexColors.secondary,
                  fontSize: '1.1rem',
                  lineHeight: 1.7,
                }}
              >
                Drokex combina la simplicidad del dropshipping con la potencia de un marketplace inteligente, 
                diseñado específicamente para empresas latinoamericanas que buscan crecer internacionalmente.
              </Typography>

              <List sx={{ mb: 4 }}>
                {features.slice(0, 4).map((feature, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircle sx={{ color: drokexColors.primary, fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={feature}
                      primaryTypographyProps={{
                        fontSize: '0.95rem',
                        color: drokexColors.secondary,
                      }}
                    />
                  </ListItem>
                ))}
              </List>

            <DrokexButton
              variant="primary"
              onClick={() => navigate('/register-choice')}
              sx={{ px: 3, py: 1.5 }}
            >
              Comenzar Gratis
            </DrokexButton>
            </Grid>

            <Grid item xs={12} md={6}>
              <BitsReveal effect="left">
                <DrokexCard variant="bordered" borderColor="primary">
                  <DrokexCardContent>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        color: drokexColors.dark,
                        fontWeight: 400,
                      }}
                    >
                      Funcionalidades Incluidas
                    </Typography>
                    
                    <List>
                      {features.slice(4).map((feature, index) => (
                        <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <CheckCircle sx={{ color: drokexColors.secondary, fontSize: 18 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            primaryTypographyProps={{
                              fontSize: '0.9rem',
                              color: drokexColors.secondary,
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </DrokexCardContent>
                </DrokexCard>
              </BitsReveal>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Formulario de Captación de Leads */}
      <DrokexPattern pattern="arrows" opacity={0.05}>
        <Container id="servicios" maxWidth="md" sx={{ py: 8 }} ref={leadFormRef}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                mb: 2,
                color: drokexColors.dark,
                fontWeight: 400,
              }}
            >
              ¿Listo para Expandir tu Negocio?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: drokexColors.secondary,
                fontSize: '1.1rem',
                maxWidth: '600px',
                mx: 'auto',
              }}
            >
              Completa este formulario y nos pondremos en contacto contigo para comenzar tu registro
            </Typography>
          </Box>

          <BitsReveal effect="up">
            <DrokexCard variant="elevated">
              <DrokexCardContent className="lp-lead-card">
              {submitSuccess && (
                <Alert
                  severity="success"
                  sx={{
                    mb: 3,
                    backgroundColor: drokexColors.pale,
                    color: drokexColors.dark,
                  }}
                >
                  ¡Gracias por tu interés! Nos pondremos en contacto contigo pronto.
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <DrokexInput
                      label="Nombre de la Empresa"
                      value={leadForm.companyName}
                      onChange={handleInputChange('companyName')}
                      error={!!errors.companyName}
                      helperText={errors.companyName}
                      icon={<Business />}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <DrokexInput
                      label="Nombre de Contacto"
                      value={leadForm.contactName}
                      onChange={handleInputChange('contactName')}
                      error={!!errors.contactName}
                      helperText={errors.contactName}
                      disabled={isSubmitting}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <DrokexInput
                      label="Correo Electrónico"
                      type="email"
                      value={leadForm.email}
                      onChange={handleInputChange('email')}
                      error={!!errors.email}
                      helperText={errors.email}
                      icon={<Email />}
                      disabled={isSubmitting}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <DrokexInput
                      label="Teléfono"
                      value={leadForm.phone}
                      onChange={handleInputChange('phone')}
                      error={!!errors.phone}
                      helperText={errors.phone}
                      icon={<Phone />}
                      disabled={isSubmitting}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <DrokexInput
                      label="Productos de Interés"
                      value={leadForm.interestedProducts}
                      onChange={handleInputChange('interestedProducts')}
                      placeholder="Ej: Productos agrícolas, textiles, artesanías..."
                      disabled={isSubmitting}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <DrokexInput
                      label="Mensaje adicional (opcional)"
                      multiline
                      rows={3}
                      value={leadForm.message}
                      onChange={handleInputChange('message')}
                      placeholder="Cuéntanos más sobre tu empresa y objetivos de exportación..."
                      disabled={isSubmitting}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <DrokexButton
                    type="submit"
                    variant="primary"
                    size="large"
                    loading={isSubmitting}
                    sx={{ px: 6, py: 1.5, fontSize: '1.1rem' }}
                  >
                    Solicitar Información
                  </DrokexButton>
                </Box>
              </Box>
            </DrokexCardContent>
            </DrokexCard>
          </BitsReveal>
        </Container>
      </DrokexPattern>

      <PublicFooter />
    </Box>
  );
};

export default LandingPage;

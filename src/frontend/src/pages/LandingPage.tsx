import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Container,
  Grid,
  TextField,
  Alert,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
  InputAdornment,
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
  ChevronLeft,
  ChevronRight,
  Search,
  Menu,
  Message,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';
import { leadsApi, tenantsApi, geoApi } from '../services/api';
import {
  DrokexButton,
  DrokexCard,
  DrokexCardContent,
  DrokexPattern
} from '../components/common';
import { drokexColors } from '../theme/drokexTheme';
import PublicNavbar from '../components/layout/PublicNavbar';
import PublicFooter from '../components/layout/PublicFooter';
import BitsReveal from '../components/bits/BitsReveal';
import BitsTilt from '../components/bits/BitsTilt';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface LeadFormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  interestedProducts: string;
  message: string;
}

type HeroLinkAction = 'benefits' | 'features' | 'contact' | 'catalog' | 'register';

interface HeroSlide {
  id: string;
  tag: string;
  title: string;
  description: string;
  image: string;
  accent: string;
  links: { label: string; action: HeroLinkAction }[];
}

interface HeroRobotTransitionProps {
  isProvider: boolean;
}

const HeroRobotTransition: React.FC<HeroRobotTransitionProps> = ({ isProvider }) => {
  const robotImage = isProvider ? '/assets/robot-verde.png' : '/assets/robot-naranja.png';
  const shadowColor = isProvider ? drokexColors.primary : '#ff8a00';

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 'auto',
      height: '75vh',
      position: 'relative',
      mx: 16
    }}>
      <AnimatePresence mode="wait">
        <motion.img
          key={isProvider ? 'provider-robot' : 'buyer-robot'}
          src={robotImage}
          alt={isProvider ? 'Robot Proveedor Verde' : 'Robot Comprador Naranja'}
          initial={{
            opacity: 0,
            x: isProvider ? 20 : -20,
            filter: 'blur(8px)',
            scale: 0.7,
            rotateY: isProvider ? 90 : -90
          }}
          animate={{
            opacity: 1,
            x: 0,
            filter: 'blur(0px)',
            scale: 1,
            rotateY: 0
          }}
          exit={{
            opacity: 0,
            x: isProvider ? -20 : 20,
            filter: 'blur(8px)',
            scale: 0.7,
            rotateY: isProvider ? -90 : 90
          }}
          transition={{
            duration: 0.25,
            ease: 'easeInOut'
          }}
          style={{
            height: '75vh',
            width: 'auto',
            filter: `drop-shadow(0 12px 40px ${shadowColor}60)`,
            maxHeight: '75vh',
            objectFit: 'contain',
            position: 'absolute'
          }}
        />
      </AnimatePresence>
    </Box>
  );
};

const LandingPage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const heroVisualRef = useRef<HTMLDivElement | null>(null);
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
  const [heroCTA, setHeroCTA] = useState('Quiero vender productos');
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | undefined>(undefined);
  const [heroVideoPoster, setHeroVideoPoster] = useState<string | undefined>(undefined);
  const [coverage, setCoverage] = useState<{ countryCode: string; country: string; tenants: number }[]>([]);
  const navigate = useNavigate();
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [hoveredButton, setHoveredButton] = useState<'provider' | 'buyer' | null>(null);

  const heroSlides = useMemo<HeroSlide[]>(
    () => [
      {
        id: 'providers',
        tag: 'Quiero vender (proveedor)',
        title: 'Conecta tu empresa con compradores B2B verificados',
        description: 'Publica catálogos, recibe solicitudes calificadas y negocia con asistencia humana en minutos.',
        image: '/assets/landing/hero-slide-01.jpg',
        accent: '#c6ff7f',
        links: [
          { label: 'Planes y servicios', action: 'benefits' },
          { label: 'Quiero vender productos', action: 'register' },
        ],
      },
      {
        id: 'buyers',
        tag: 'Buscar proveedor',
        title: 'Explora fabricantes confiables en toda LATAM',
        description: 'Centraliza tus búsquedas de productos, valida certificaciones y cierra acuerdos desde un único lugar.',
        image: '/assets/landing/hero-slide-02.jpg',
        accent: '#b3ffe4',
        links: [
          { label: 'Ver catálogo', action: 'catalog' },
          { label: 'Contactar al equipo', action: 'contact' },
        ],
      },
      {
        id: 'platform',
        tag: 'Planes y beneficios',
        title: 'Opera tu marketplace local con la plataforma Drokex',
        description: 'Automatizamos onboarding, pagos multi-moneda y logística transfronteriza con analítica en tiempo real.',
        image: '/assets/landing/hero-slide-02.jpg',
        accent: '#ffe36b',
        links: [
          { label: 'Ver funcionalidades', action: 'features' },
          { label: 'Solicitar demo', action: 'register' },
        ],
      },
    ],
    []
  );

  const heroPills = useMemo(
    () => [
      {
        title: 'Expansión Internacional',
        description: 'Llegamos a 12 países con hubs locales y presencia regulatoria.',
      },
      {
        title: 'Transacciones Seguras',
        description: 'Escrow, financiamiento y seguimiento logístico integrado.',
      },
      {
        title: 'Onboarding Acompañado',
        description: 'Aceleramos tu registro con plantillas, asesoría y automatizaciones.',
      },
    ],
    []
  );

  const heroStats = useMemo(
    () => [
      { value: '1.2K+', label: 'Empresas conectadas' },
      { value: '12', label: 'Marketplaces activos en LATAM' },
      { value: '98%', label: 'Operaciones exitosas' },
    ],
    []
  );

  const heroCtas = useMemo(
    () => [
      {
        label: heroCTA || 'Quiero vender productos',
        action: () => navigate('/register'),
        variant: 'primary' as const,
        sx: { fontSize: '1.05rem', px: 4, py: 1.4, backgroundColor: 'white', color: drokexColors.primary },
      },
      {
        label: 'Buscar Proveedores',
        action: () => navigate('/catalog'),
        variant: 'outline' as const,
        sx: { fontSize: '1.05rem', px: 4, py: 1.4, borderColor: 'rgba(255,255,255,0.7)', color: 'white' },
      },
      {
        label: 'Registrarme como Comprador',
        action: () => navigate('/signup'),
        variant: 'ghost' as const,
        sx: { fontSize: '1.05rem', px: 4, py: 1.4, color: 'white' },
      },
    ],
    [heroCTA, navigate]
  );

  const scrollToSection = (sectionRef: React.RefObject<HTMLDivElement>) => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSlideLink = (action: HeroLinkAction) => {
    switch (action) {
      case 'benefits':
        scrollToSection(benefitsRef);
        break;
      case 'features':
        scrollToSection(featuresRef);
        break;
      case 'contact':
        scrollToSection(leadFormRef);
        break;
      case 'catalog':
        navigate('/catalog');
        break;
      case 'register':
        navigate('/register-choice');
        break;
      default:
        break;
    }
  };

  const handleHeroSlide = (direction: 'prev' | 'next') => {
    setHeroSlideIndex(prev => {
      if (direction === 'prev') {
        return prev === 0 ? heroSlides.length - 1 : prev - 1;
      }
      return prev === heroSlides.length - 1 ? 0 : prev + 1;
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroSlideIndex(prev => (prev === heroSlides.length - 1 ? 0 : prev + 1));
    }, 6000);

    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const currentSlide = heroSlides[heroSlideIndex];

  useEffect(() => {
    if (!heroVisualRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.lp-hero-slide-content',
        { opacity: 0, x: 40 },
        { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' }
      );

      gsap.from('.lp-hero-link', {
        opacity: 0,
        x: -20,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.2,
      });
    }, heroVisualRef);

    return () => ctx.revert();
  }, [heroSlideIndex]);

  useEffect(() => {
    if (!heroVisualRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to('.lp-hero-link', {
        y: 8,
        repeat: -1,
        yoyo: true,
        duration: 3,
        ease: 'sine.inOut',
        stagger: 0.25,
      });
    }, heroVisualRef);

    return () => ctx.revert();
  }, []);
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

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline()
        .from('.hero-animate', { opacity: 0, y: 30, duration: 0.8, stagger: 0.15 })
        .from('.hero-stat-card', { opacity: 0, y: 20, duration: 0.6, stagger: 0.1 }, '-=0.5');

      gsap.utils.toArray<HTMLElement>('.hero-floating').forEach((el, index) => {
        gsap.to(el, {
          y: index % 2 === 0 ? 18 : -18,
          x: index % 2 === 0 ? 12 : -12,
          duration: 4 + index,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!benefitsRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.lp-benefit', {
        scrollTrigger: {
          trigger: benefitsRef.current,
          start: 'top 80%',
        },
        y: 40,
        opacity: 0,
        stagger: 0.2,
        duration: 0.6,
        ease: 'power2.out',
      });
    }, benefitsRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!featuresRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.lp-feature-card', {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 75%',
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
      });
    }, featuresRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!leadFormRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.lp-lead-card', {
        scrollTrigger: {
          trigger: leadFormRef.current,
          start: 'top 75%',
        },
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
      });
    }, leadFormRef);

    return () => ctx.revert();
  }, []);
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
      {/* Public Navbar consistent with brand - Sticky Header */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100 }}>
        <PublicNavbar />
      </Box>
      {/* Espaciado para compensar el navbar fijo */}
      {/* <Box sx={{ height: '80px' }}></Box> */}
      {/* Hero Section con elementos animados */}
      <Box
        ref={heroRef}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: heroVideoUrl
            ? undefined
            : hoveredButton === 'buyer'
            ? 'radial-gradient(ellipse at center, #2a1f0f 0%, #1a0f05 70%, #0f0703 100%)'
            : 'radial-gradient(ellipse at center, #0b3b25 0%, #04150d 70%, #021007 100%)',
          color: 'white',
          transition: 'all 0.25s ease-in-out',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: hoveredButton === 'buyer'
              ? 'url(/assets/triangulo-naranja.png)'
              : 'url(/assets/triangulo-verde.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.3,
            zIndex: 1,
            transition: 'all 0.25s ease-in-out',
          }
        }}
      >
        {heroVideoUrl && (
          <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
            <Box
              component="video"
              src={heroVideoUrl}
              poster={heroVideoPoster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.4)' }}
            />
          </Box>
        )}
        <Box
          className="hero-floating"
          sx={{
            position: 'absolute',
            top: -80,
            left: '10%',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.35), transparent 60%)',
            opacity: 0.6,
            zIndex: 0,
          }}
        />
        <Box
          className="hero-floating"
          sx={{
            position: 'absolute',
            bottom: -120,
            right: '5%',
            width: 260,
            height: 260,
            borderRadius: '45%',
            background: 'radial-gradient(circle, rgba(14,111,55,0.8), transparent 70%)',
            filter: 'blur(2px)',
            zIndex: 0,
          }}
        />
        <Container maxWidth="lg" sx={{ pt: 8, pb: 10, position: 'relative', zIndex: 2 }}>
          <Grid container spacing={6} alignItems="center" justifyContent="center">
            <Grid item xs={12}>
              
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
                        mb: 2,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                      }}
                      className="hero-animate"
                    />
                  </Tooltip>
                );
              })()}

              {/* <Typography
                variant="h2"
                sx={{
                  mb: 2,
                  fontWeight: 500,
                  fontSize: { xs: '2.1rem', md: '3.25rem' },
                  color: 'white',
                  textShadow: '0 18px 70px rgba(0,0,0,0.45)',
                }}
                className="hero-animate"
              >
                {heroTitle}
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  mb: 3,
                  fontWeight: 300,
                  lineHeight: 1.7,
                }}
                className="hero-animate"
              >
                {heroSubtitle}
              </Typography> */}

              {/* Centered Search Bar */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }} className="hero-animate">
                <Paper
                  component="form"
                  onSubmit={(e: any) => {
                    e.preventDefault();
                    const v = (e.target?.query?.value || '').trim();
                    navigate(`/catalog${v ? `?search=${encodeURIComponent(v)}` : ''}`);
                  }}
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: '600px',
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    borderRadius: 4,
                    boxShadow: '0 25px 80px rgba(0,0,0,0.35)',
                    my: 2,
                  }}
                >
                  <TextField
                    name="query"
                    placeholder="Buscar productos y empresas…"
                    variant="standard"
                    fullWidth
                    InputProps={{
                      disableUnderline: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: drokexColors.secondary }} />
                        </InputAdornment>
                      ),
                      sx: { px: 1 },
                    }}
                  />
                  <DrokexButton type="submit" variant="primary" sx={{ ml: 1 }}>
                    Buscar
                  </DrokexButton>
                </Paper>
              </Box>

              {/* Action Buttons with Robots */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                mb: 3
              }} className="hero-animate hero-cta">
                <BitsTilt>
                  <Box
                    onClick={() => navigate('/register-choice')}
                    sx={{
                      minWidth: '260px',
                      minHeight: '104px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 3,
                      border: `3px solid ${drokexColors.primary}`,
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      boxShadow: '0 8px 32px rgba(255, 255, 255, 0.2), inset 0 2px 8px rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: `rgba(76, 255, 146, 0.2)`,
                        borderColor: drokexColors.secondary,
                        transform: 'translateY(-3px)',
                        boxShadow: `0 12px 40px rgba(76, 255, 146, 0.3), inset 0 2px 12px rgba(255, 255, 255, 0.2)`
                      }
                    }}
                  >
                    <Typography sx={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: 'white',
                      letterSpacing: '1px',
                      lineHeight: 1
                    }}>
                      QUIERO
                    </Typography>
                    <Typography sx={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: 'white',
                      letterSpacing: '0.5px',
                      lineHeight: 1,
                      mt: 0.5
                    }}>
                      vender productos
                    </Typography>
                  </Box>
                </BitsTilt>

                {/* Robot Images as Protagonists */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <HeroRobotTransition isProvider={hoveredButton !== 'buyer'} />
                </Box>

                <BitsTilt>
                  <Box
                    onClick={() => navigate('/catalog')}
                    onMouseEnter={() => setHoveredButton('buyer')}
                    onMouseLeave={() => setHoveredButton(null)}
                    sx={{
                      minWidth: '260px',
                      minHeight: '104px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 3,
                      border: '3px solid #ff8a00',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      boxShadow: '0 8px 32px rgba(255, 255, 255, 0.2), inset 0 2px 8px rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 138, 0, 0.2)',
                        borderColor: '#ffaa33',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 12px 40px rgba(255, 138, 0, 0.3), inset 0 2px 12px rgba(255, 255, 255, 0.2)'
                      }
                    }}
                  >
                    <Typography sx={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: 'white',
                      letterSpacing: '1px',
                      lineHeight: 1
                    }}>
                      QUIERO
                    </Typography>
                    <Typography sx={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: 'white',
                      letterSpacing: '0.5px',
                      lineHeight: 1,
                      mt: 0.5
                    }}>
                      buscar proveedor
                    </Typography>
                  </Box>
                </BitsTilt>
              </Box>

              <Grid container spacing={2} sx={{ mt: 2 }} className="hero-animate">
                {heroPills.map(pill => (
                  <Grid item xs={12} sm={4} key={pill.title}>
                    <Box
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        borderRadius: 3,
                        p: 2,
                        border: '1px solid rgba(255,255,255,0.2)',
                        minHeight: 120,
                      }}
                      className="hero-pill"
                    >
                      <Typography variant="subtitle1" sx={{ color: 'white', mb: 0.5, fontWeight: 500 }}>
                        {pill.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                        {pill.description}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 4 }} className="hero-animate">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    backgroundColor: 'rgba(5,18,12,0.6)',
                    borderRadius: 999,
                    px: 2,
                    py: 1,
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <IconButton size="small" onClick={() => handleHeroSlide('prev')} sx={{ color: 'white' }}>
                    <ChevronLeft />
                  </IconButton>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{currentSlide.title}</Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>
                      {currentSlide.description}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => handleHeroSlide('next')} sx={{ color: 'white' }}>
                    <ChevronRight />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                  {heroSlides.map((_, index) => (
                    <Box
                      key={`hero-slide-${index}`}
                      sx={{
                        width: index === heroSlideIndex ? 18 : 12,
                        height: 12,
                        borderRadius: 999,
                        backgroundColor: index === heroSlideIndex ? 'white' : 'rgba(255,255,255,0.4)',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Hidden visual grid - keeping for future reference */}
            <Grid item xs={12} md={6} sx={{ display: 'none' }}>
              <Box
                ref={heroVisualRef}
                sx={{
                  position: 'relative',
                  borderRadius: 4,
                  p: { xs: 0, md: 1.5 },
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
                  overflow: 'hidden',
                }}
                className="hero-animate hero-visual"
              >
                <Box
                  key={currentSlide.id}
                  className="lp-hero-slide-content"
                  sx={{
                    position: 'relative',
                    minHeight: { xs: 360, md: 460 },
                    borderRadius: { xs: 0, md: 3 },
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(4, 21, 13, 0.55) 0%, rgba(4, 21, 13, 0.95) 75%)',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      p: { xs: 3, md: 4 },
                    }}
                  >
                    <Chip
                      icon={<LocationOn sx={{ color: drokexColors.secondary }} />}
                      label={currentSlide.tag}
                      sx={{
                        alignSelf: 'flex-start',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        color: drokexColors.dark,
                        fontWeight: 600,
                        borderRadius: 999,
                        px: 1.5,
                      }}
                    />
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 600, lineHeight: 1.3 }}>
                      {currentSlide.title}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                      {currentSlide.description}
                    </Typography>
                    <List dense sx={{ color: 'white', py: 0 }}>
                      {features.slice(0, 3).map(item => (
                        <ListItem key={`${currentSlide.id}-${item}`} sx={{ px: 0, py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 34 }}>
                            <CheckCircle sx={{ color: currentSlide.accent, fontSize: 22 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={item}
                            primaryTypographyProps={{
                              fontSize: '0.95rem',
                              color: 'rgba(255,255,255,0.95)',
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, position: 'relative', alignItems: 'center', justifyContent: 'center', minHeight: '60px' }}>
                      {currentSlide.links.map((link, index) => (
                        <Chip
                          key={`${currentSlide.id}-${link.label}`}
                          label={link.label}
                          onClick={() => handleSlideLink(link.action)}
                          clickable
                          className="lp-hero-link"
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.4)',
                            borderRadius: 999,
                            fontWeight: 500,
                            px: 2,
                            order: index === 0 ? 1 : 3, // Primer botón a la izquierda, segundo a la derecha
                          }}
                        />
                      ))}

                      {/* Robot en el centro entre los botones */}
                      <Box sx={{ order: 2, mx: 2 }}>
                        <HeroRobotTransition isProvider={heroSlideIndex === 0} />
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        mt: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: currentSlide.accent,
                            boxShadow: `0 0 12px ${currentSlide.accent}`,
                          }}
                        />
                        <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>
                          Cobertura LATAM • Hub digital
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {heroSlides.map((slide, index) => (
                          <Box
                            key={slide.id}
                            sx={{
                              width: index === heroSlideIndex ? 30 : 12,
                              height: 12,
                              borderRadius: 999,
                              backgroundColor:
                                index === heroSlideIndex ? currentSlide.accent : 'rgba(255,255,255,0.35)',
                              transition: 'all 0.3s ease',
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: { xs: 6, md: 8 } }}>
            {heroStats.map(stat => (
              <Grid item xs={12} sm={4} key={stat.label}>
                <DrokexCard variant="interactive" sx={{ height: '100%' }} className="hero-stat-card">
                  <DrokexCardContent>
                    <Typography variant="h4" sx={{ color: drokexColors.primary, mb: 1, fontWeight: 600 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: drokexColors.dark }}>
                      {stat.label}
                    </Typography>
                  </DrokexCardContent>
                </DrokexCard>
              </Grid>
            ))}
          </Grid>
        </Container>
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
                <DrokexCard variant="bordered" borderColor="primary" className="lp-feature-card">
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

      {/* Sección de Contacto */}
      <Box sx={{
        backgroundColor: '#f8f9fa',
        py: 8,
        position: 'relative',
        overflow: 'hidden',
        minHeight: '600px'
      }}>
        <Container id="contacto" maxWidth="xl" ref={leadFormRef}>
          {/* Título Principal */}
          <Box sx={{ textAlign: 'left', mb: 6 }}>
            <Typography
              variant="h2"
              sx={{
                mb: 2,
                color: drokexColors.dark,
                fontWeight: 500,
                fontSize: { xs: '1.5rem', md: '2rem' }
              }}
            >
              Contáctanos
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: drokexColors.secondary,
                fontSize: '1.1rem',
                maxWidth: '600px',
              }}
            >
              ¿Tienes alguna pregunta o necesitas ayuda? Llena el formulario y nos pondremos en contacto contigo muy pronto.
            </Typography>
          </Box>

          <Grid container spacing={8} sx={{ position: 'relative', zIndex: 2, minHeight: '600px' }}>
            {/* Formulario de Contacto - Lado Izquierdo */}
            <Grid item xs={12} lg={6}>
              <Box sx={{ backgroundColor: 'white', p: 4, borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h5" sx={{ mb: 3, color: drokexColors.dark, fontWeight: 400 }}>
                  Envíanos un mensaje
                </Typography>

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
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Nombre"
                        value={leadForm.contactName}
                        onChange={handleInputChange('contactName')}
                        error={!!errors.contactName}
                        helperText={errors.contactName}
                        disabled={isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Business sx={{ color: drokexColors.primary }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: drokexColors.primary,
                            }
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Correo Electrónico"
                        type="email"
                        value={leadForm.email}
                        onChange={handleInputChange('email')}
                        error={!!errors.email}
                        helperText={errors.email}
                        disabled={isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email sx={{ color: drokexColors.primary }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: drokexColors.primary,
                            }
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        select
                        label="Motivo"
                        value={leadForm.interestedProducts}
                        onChange={handleInputChange('interestedProducts')}
                        disabled={isSubmitting}
                        SelectProps={{ native: true }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Menu sx={{ color: drokexColors.primary }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: drokexColors.primary,
                            }
                          }
                        }}
                      >
                        <option value="">Selecciona un motivo</option>
                        <option value="Información general">Información general</option>
                        <option value="Soporte técnico">Soporte técnico</option>
                        <option value="Ventas">Ventas</option>
                        <option value="Asociación comercial">Asociación comercial</option>
                        <option value="Otro">Otro</option>
                      </TextField>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Mensaje"
                        multiline
                        rows={4}
                        value={leadForm.message}
                        onChange={handleInputChange('message')}
                        disabled={isSubmitting}
                        placeholder="Escribe tu mensaje aquí..."
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                              <Message sx={{ color: drokexColors.primary }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: drokexColors.primary,
                            }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                    <DrokexButton
                      type="submit"
                      variant="primary"
                      size="large"
                      loading={isSubmitting}
                      sx={{
                        py: 1.5,
                        fontSize: '1rem',
                        borderRadius: 2,
                        backgroundColor: drokexColors.primary,
                        color: 'white',
                        width: '33%',
                        '&:hover': {
                          backgroundColor: drokexColors.secondary,
                        }
                      }}
                    >
                      Enviar mensaje
                    </DrokexButton>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Información de Contacto - Lado Derecho */}
            <Grid item xs={12} lg={6}>
              <Box sx={{ position: 'relative', height: '100%',padding: '32px',
                  borderRadius: '24px',
                  boxShadow: '0px 3px 3px -2px rgba(0, 0, 0, 0.2), 0px 3px 4px 0px rgba(0, 0, 0, 0.14), 0px 1px 8px 0px rgba(0, 0, 0, 0.12)', }}>
                {/* Información de Contacto */}
                <Box sx={{ mb: 6 }}>
                  <Typography variant="h5" sx={{ mb: 4, color: drokexColors.dark, fontWeight: 400 }}>
                    Contáctanos con telefono
                  </Typography>

                  <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Phone sx={{ color: drokexColors.primary, fontSize: 24 }} />
                    <Typography variant="h6" sx={{ color: drokexColors.dark }}>
                     +57 311 531 2623
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Email sx={{ color: drokexColors.primary, fontSize: 24 }} />
                    <Typography variant="h6" sx={{ color: drokexColors.dark }}>
                      contacto@drokex.com
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LocationOn sx={{ color: drokexColors.primary, fontSize: 24 }} />
                    <Box>
                      <Typography variant="h6" sx={{ color: drokexColors.dark }}>
                        Avenida carrera 28 #34-43
                      </Typography>
                      <Typography variant="h6" sx={{ color: drokexColors.dark }}>
                        Bogotá, Colombia
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                
              </Box>
            </Grid>

            {/* Robot Drokex - Imagen Real */}
            <Box sx={{
              position: 'absolute',
              right: -200,
              top: 0,
              bottom: 0,
              zIndex: 10,
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              justifyContent: 'flex-end',
              width: '40%',
              pointerEvents: 'none'
            }}>
                  <Box
                    component="img"
                    src="/assets/drokex-robot-contacto.png"
                    alt="Robot Drokex - Contacto"
                    sx={{
                      height: '100%',
                      width: 'auto',
                      minHeight: '400px',
                      objectFit: 'contain',
                      objectPosition: 'bottom center',
                      filter: 'brightness(1.05) contrast(1.2) saturate(1.1) drop-shadow(0 15px 35px rgba(0,0,0,0.15))',
                      opacity: 0.9,
                      mixBlendMode: 'darken',
                      transition: 'all 0.3s ease',
                      maskImage: 'linear-gradient(to top, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.8) 60%, rgba(255,255,255,1) 100%)',
                      WebkitMaskImage: 'linear-gradient(to top, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.8) 60%, rgba(255,255,255,1) 100%)',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        opacity: 0.95
                      }
                    }}
                    onError={(e) => {
                      // Fallback si no se encuentra la imagen
                      console.log('No se pudo cargar la imagen del robot');
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />

                  {/* Efecto de brillo sutil */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `radial-gradient(circle at 30% 30%, ${drokexColors.primary}15 0%, transparent 60%)`,
                    borderRadius: '50%',
                    animation: 'subtleGlow 4s ease-in-out infinite',
                    pointerEvents: 'none'
                  }} />

                  {/* Estilos de animación sutil */}
                  <style>
                    {`
                      @keyframes subtleGlow {
                        0%, 100% { opacity: 0.3; transform: scale(1); }
                        50% { opacity: 0.6; transform: scale(1.02); }
                      }
                    `}
                  </style>
            </Box>
          </Grid>
        </Container>
      </Box>

      <PublicFooter />
    </Box>
  );
};

export default LandingPage;

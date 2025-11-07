import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Divider,
  Link,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import {
  DrokexLogo, 
  DrokexButton, 
  DrokexInput, 
  DrokexCard, 
  DrokexCardContent,
  DrokexPattern 
} from '../components/common';
import { drokexColors } from '../theme/drokexTheme';
import { 
  Business, 
  Person, 
  Email, 
  Phone, 
  Language,
  LocationOn,
  Description,
  Lock,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import PublicNavbar from '../components/layout/PublicNavbar';
import PublicFooter from '../components/layout/PublicFooter';
import { tenantsApi, imagesApi, companiesApi, authApi, catalogApi } from '../services/api';
import { COUNTRIES, findCountryByCode } from '../data/countries';
import { CITIES_BY_COUNTRY } from '../data/cities';
// Business types se cargan desde API del catálogo

interface CompanyData {
  // Datos de la empresa
  name: string;
  businessType: string;
  taxId: string;
  website: string;
  description: string;
  
  // Datos de contacto
  contactEmail: string;
  phone: string;
  address: string;
  city: string;
  countryCode: string;
  country: string;
  phoneDial: string;
  logoUrl?: string;
  
  // Datos del usuario administrador
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  
  // Términos
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

const Register: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<CompanyData>({
    name: '',
    businessType: '',
    taxId: '',
    website: '',
    description: '',
    contactEmail: '',
    phone: '',
    address: '',
    city: '',
    countryCode: 'HN',
    country: 'Honduras',
    phoneDial: '+504',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptPrivacy: false,
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [subdomain, setSubdomain] = useState('');
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  
  const { registerCompany, isLoading, error } = useAuth();
  const { tenant, getCountryFlag, refreshTenant } = useTenant();
  const navigate = useNavigate();
  const [pwVisible, setPwVisible] = useState(false);
  const [pwVisible2, setPwVisible2] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);

  const steps = ['Información de la Empresa', 'Datos de Contacto', 'Cuenta de Usuario'];

  // Slugify company name -> subdomain
  const slugify = (name: string) => {
    return name
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
  };

  // Update subdomain when name changes
  useEffect(() => {
    const s = slugify(formData.name || '');
    setSubdomain(s);
  }, [formData.name]);

  // Debounced availability check
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!subdomain) { setSubdomainAvailable(null); return; }
      try {
        setCheckingSubdomain(true);
        const { data } = await tenantsApi.checkSubdomain(subdomain);
        if (!cancelled) setSubdomainAvailable(data.data?.IsAvailable ?? null);
      } catch {
        if (!cancelled) setSubdomainAvailable(null);
      } finally {
        if (!cancelled) setCheckingSubdomain(false);
      }
    };
    const t = setTimeout(check, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [subdomain]);

  // Cargar tipos de negocio desde API (fallback a una lista por defecto)
  useEffect(() => {
    let cancelled = false;
    const defaults = ['Fabricante','Exportador','Distribuidor','Mayorista','Minorista','Importador','Proveedor de servicios','Artesano/Hecho a mano','Cooperativa','Otro'];
    (async () => {
      try {
        const { data } = await catalogApi.getBusinessTypes();
        if (!cancelled) {
          const arr = (data?.data || []).map((x: any) => x.name as string);
          setBusinessTypes(arr && arr.length ? arr : defaults);
        }
      } catch {
        if (!cancelled) setBusinessTypes(defaults);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const validateStep = (step: number) => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 0: // Información de la empresa
        if (!formData.name.trim()) {
          newErrors.name = 'El nombre de la empresa es requerido';
        }
        if (!formData.businessType.trim()) {
          newErrors.businessType = 'El tipo de negocio es requerido';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'La descripción de la empresa es requerida';
        }
        if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
          newErrors.website = 'Ingresa una URL válida (ej: https://tuempresa.com)';
        }
        break;

      case 1: // Datos de contacto
        if (!formData.contactEmail.trim()) {
          newErrors.contactEmail = 'El correo de contacto es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
          newErrors.contactEmail = 'Ingresa un correo electrónico válido';
        }
        if (!formData.phone.trim()) {
          newErrors.phone = 'El teléfono es requerido';
        }
        if (!formData.address.trim()) {
          newErrors.address = 'La dirección es requerida';
        }
        if (!formData.city.trim()) {
          newErrors.city = 'La ciudad es requerida';
        }
        break;

      case 2: // Cuenta de usuario
        if (!formData.firstName.trim()) {
          newErrors.firstName = 'El nombre es requerido';
        }
        if (!formData.lastName.trim()) {
          newErrors.lastName = 'El apellido es requerido';
        }
        if (!formData.email.trim()) {
          newErrors.email = 'El correo electrónico es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Ingresa un correo electrónico válido';
        }
        if (!formData.password) {
          newErrors.password = 'La contraseña es requerida';
        } else {
          const hasNumber = /\d/.test(formData.password);
          const hasSymbol = /[^A-Za-z0-9]/.test(formData.password);
          if (!hasNumber || !hasSymbol) {
            newErrors.password = 'Debe incluir al menos un número y un signo';
          }
          if (formData.password.length < 8) {
            newErrors.password = (newErrors.password ? newErrors.password + '. ' : '') + 'Mínimo 8 caracteres';
          }
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }
        if (!formData.acceptTerms) {
          newErrors.acceptTerms = 'Debes aceptar los términos y condiciones';
        }
        if (!formData.acceptPrivacy) {
          newErrors.acceptPrivacy = 'Debes aceptar la política de privacidad';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (field: keyof CompanyData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBusinessTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, businessType: value }));
    if (errors['businessType']) setErrors(prev => ({ ...prev, businessType: '' }));
  };

  const handleCountryChange = (code: string) => {
    const c = findCountryByCode(code) || findCountryByCode('HN');
    setFormData(prev => ({
      ...prev,
      countryCode: c?.code || 'HN',
      country: c?.name || 'Honduras',
      phoneDial: c?.dialCode || '+504',
    }));
  };

  const handlePhoneNumberChange = (num: string) => {
    setFormData(prev => ({ ...prev, phone: `${prev.phoneDial} ${num}`.trim() }));
    if (errors['phone']) setErrors(prev => ({ ...prev, phone: '' }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) { setErrors(prev => ({ ...prev, logoUrl: 'Formato inválido (PNG/JPG/WEBP)' } as any)); return; }
    if (file.size > 5 * 1024 * 1024) { setErrors(prev => ({ ...prev, logoUrl: 'Tamaño máximo 5MB' } as any)); return; }
    try {
      setUploadingLogo(true);
      const { data } = await imagesApi.upload(file);
      const url = (data as any).data as string;
      setFormData(prev => ({ ...prev, logoUrl: url }));
      setErrors(prev => ({ ...prev, logoUrl: '' } as any));
    } finally {
      setUploadingLogo(false);
      (e.target as HTMLInputElement).value = '';
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    try {
      setIsSubmitted(true);
      // Asegurar subdominio disponible y crear tenant si no existe
      const s = slugify(formData.name);
      if (!s) {
        setErrors(prev => ({ ...prev, name: 'El nombre de la empresa es requerido' }));
        setIsSubmitted(false);
        return;
      }
      const { data: chk } = await tenantsApi.checkSubdomain(s);
      if (!chk.data?.IsAvailable) {
        setErrors(prev => ({ ...prev, name: 'El subdominio generado ya existe. Ajusta el nombre de la empresa.' }));
        setIsSubmitted(false);
        return;
      }

      // Crear tenant con mínimos por defecto (se puede ajustar luego)
      const { data: setup } = await tenantsApi.setupTenant({
        subdomain: s,
        country: formData.country || tenant?.country || 'Honduras',
        countryCode: formData.countryCode || tenant?.countryCode || 'HN',
        currency: (findCountryByCode(formData.countryCode || tenant?.countryCode || 'HN')?.currency) || tenant?.currency || 'USD',
        currencySymbol: (findCountryByCode(formData.countryCode || tenant?.countryCode || 'HN')?.currencySymbol) || tenant?.currencySymbol || '$',
        adminEmail: formData.email,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        languageCode: 'es',
      });
      const newTenantId: number | undefined = setup.data?.Id ?? setup.data?.id ?? setup.data?.createdTenant?.Id ?? setup.data?.createdTenant?.id;
      if (!newTenantId) {
        throw new Error('No se pudo crear el tenant');
      }

      // Construir objeto para registro
      const registrationData = {
        // Datos del usuario
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        
        // Datos de la empresa
        company: {
          name: formData.name,
          businessType: formData.businessType,
          taxId: formData.taxId,
          website: formData.website,
          description: formData.description,
          contactEmail: formData.contactEmail,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
        },
        tenantId: newTenantId,
      };

      await registerCompany(registrationData);

      // Si se subió logo, intentar actualizar la empresa luego del registro
      if (formData.logoUrl) {
        setTimeout(async () => {
          try {
            const profile = await authApi.getProfile();
            const companyId = (profile.data?.data as any)?.companyId as number | undefined;
            if (companyId) {
              await companiesApi.updateCompany(companyId, {
                name: formData.name,
                description: formData.description,
                contactEmail: formData.contactEmail,
                phone: formData.phone,
                address: formData.address + (formData.city ? `, ${formData.city}` : ''),
                website: formData.website,
                logo: formData.logoUrl,
              } as any);
            }
          } catch {}
        }, 600);
      }
      
      // El usuario será redirigido automáticamente por el contexto de autenticación
      // o se mostrará un mensaje de éxito si requiere aprobación
      
    } catch (error) {
      // Error manejado por el contexto
      console.error('Registration error:', error);
      setIsSubmitted(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: drokexColors.dark }}>
                Información de tu Empresa
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <DrokexInput
                label="Nombre de la Empresa *"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                icon={<Business />}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12}>
              <DrokexInput
                label="Subdominio"
                value={subdomain}
                onChange={() => {}}
                helperText={
                  checkingSubdomain
                    ? 'Verificando disponibilidad…'
                    : subdomain
                      ? (subdomainAvailable === false
                          ? `No disponible: http://${subdomain}.localhost:3100`
                          : `Quedará como: http://${subdomain}.localhost:3100`)
                      : 'Se genera automáticamente a partir del nombre'
                }
                disabled
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="biz-type">Tipo de Negocio *</InputLabel>
                <Select labelId="biz-type" label="Tipo de Negocio *" value={formData.businessType} onChange={(e) => handleBusinessTypeChange(e.target.value as string)} disabled={isLoading}>
                  {businessTypes.map(bt => (
                    <MenuItem key={bt} value={bt}>{bt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {!!errors.businessType && (
                <Typography variant="caption" sx={{ color: '#d32f2f' }}>{errors.businessType}</Typography>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <DrokexInput
                label="Número de Identificación Tributaria"
                value={formData.taxId}
                onChange={handleInputChange('taxId')}
                error={!!errors.taxId}
                helperText={errors.taxId || 'RTN, RUC, RFC, etc. según tu país'}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12}>
              <DrokexInput
                label="Sitio Web"
                value={formData.website}
                onChange={handleInputChange('website')}
                error={!!errors.website}
                helperText={errors.website}
                icon={<Language />}
                placeholder="https://tuempresa.com"
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12}>
              <DrokexInput
                label="Descripción de la Empresa *"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange('description')}
                error={!!errors.description}
                helperText={errors.description || 'Describe tu empresa, productos principales y experiencia'}
                icon={<Description />}
                disabled={isLoading}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: drokexColors.dark }}>
                Información de Contacto
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <DrokexInput
                label="Correo de Contacto *"
                type="email"
                value={formData.contactEmail}
                onChange={handleInputChange('contactEmail')}
                error={!!errors.contactEmail}
                helperText={errors.contactEmail}
                icon={<Email />}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="country-label">País *</InputLabel>
                <Select labelId="country-label" label="País *" value={formData.countryCode} onChange={(e) => handleCountryChange(e.target.value as string)} disabled={isLoading}>
                  {COUNTRIES.map(c => (
                    <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel id="dial-label">Indicativo</InputLabel>
                  <Select labelId="dial-label" label="Indicativo" value={formData.phoneDial} onChange={(e) => setFormData(prev => ({ ...prev, phoneDial: e.target.value as string }))}>
                    {COUNTRIES.map(c => (
                      <MenuItem key={c.code} value={c.dialCode}>{`${c.code} ${c.dialCode}`}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <DrokexInput fullWidth label="Teléfono *" value={formData.phone.replace(formData.phoneDial, '').trim()} onChange={(e) => handlePhoneNumberChange(e.target.value)} error={!!errors.phone} helperText={errors.phone || 'Incluye tu número sin el indicativo'} icon={<Phone />} disabled={isLoading} />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <DrokexInput
                label="Dirección *"
                value={formData.address}
                onChange={handleInputChange('address')}
                error={!!errors.address}
                helperText={errors.address}
                icon={<LocationOn />}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              {CITIES_BY_COUNTRY[formData.countryCode] ? (
                <FormControl fullWidth>
                  <InputLabel id="city-label">Ciudad *</InputLabel>
                  <Select labelId="city-label" label="Ciudad *" value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value as string }))} disabled={isLoading}>
                    {CITIES_BY_COUNTRY[formData.countryCode].map(ct => (<MenuItem key={ct} value={ct}>{ct}</MenuItem>))}
                  </Select>
                </FormControl>
              ) : (
                <DrokexInput label="Ciudad *" value={formData.city} onChange={handleInputChange('city')} error={!!errors.city} helperText={errors.city || 'Escribe tu ciudad'} disabled={isLoading} />
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  backgroundColor: drokexColors.pale,
                  p: 2,
                  borderRadius: 2,
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" sx={{ color: drokexColors.dark, fontWeight: 500 }}>
                  País: {formData.country || tenant?.country}
                </Typography>
                <Typography variant="caption" sx={{ color: drokexColors.secondary }}>
                  Moneda: {findCountryByCode(formData.countryCode || tenant?.countryCode)?.currencySymbol || tenant?.currencySymbol} {findCountryByCode(formData.countryCode || tenant?.countryCode)?.currency || tenant?.currency}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DrokexButton component="label" variant="outline" loading={uploadingLogo}>
                  Subir logotipo
                  <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleLogoUpload} />
                </DrokexButton>
                {formData.logoUrl && (
                  <Box component="img" src={formData.logoUrl} alt="logo" sx={{ height: 48, objectFit: 'contain', borderRadius: 1, border: `1px solid ${drokexColors.pale}`, p: 0.5, background: '#fff' }} />
                )}
              </Box>
              <Typography variant="caption" sx={{ color: drokexColors.secondary }}>
                Formatos: PNG/JPG/WEBP. Máx. 5MB.
              </Typography>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: drokexColors.dark }}>
                Cuenta de Administrador
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <DrokexInput
                label="Nombre *"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName}
                icon={<Person />}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DrokexInput
                label="Apellido *"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12}>
              <DrokexInput
                label="Correo Electrónico *"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!errors.email}
                helperText={errors.email || 'Este será tu usuario para acceder a la plataforma'}
                icon={<Email />}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DrokexInput
                label="Contraseña *"
                type={pwVisible ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                error={!!errors.password}
                helperText={errors.password || 'Debe incluir al menos 1 número y 1 signo (min. 8 caracteres)'}
                icon={<Lock />}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setPwVisible(v => !v)} edge="end" aria-label="mostrar contraseña">
                      {pwVisible ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DrokexInput
                label="Confirmar Contraseña *"
                type={pwVisible2 ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                icon={<Lock />}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setPwVisible2(v => !v)} edge="end" aria-label="mostrar contraseña">
                      {pwVisible2 ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.acceptTerms}
                    onChange={handleInputChange('acceptTerms')}
                    sx={{
                      color: drokexColors.secondary,
                      '&.Mui-checked': { color: drokexColors.primary },
                    }}
                  />
                }
                label={
                  <Typography variant="body2">
                    Acepto los{' '}
                    <Link href="#" sx={{ color: drokexColors.primary, textDecoration: 'none' }}>
                      términos y condiciones
                    </Link>{' '}
                    de uso de la plataforma
                  </Typography>
                }
              />
              {errors.acceptTerms && (
                <Typography variant="caption" sx={{ color: '#d32f2f', ml: 4 }}>
                  {errors.acceptTerms}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.acceptPrivacy}
                    onChange={handleInputChange('acceptPrivacy')}
                    sx={{
                      color: drokexColors.secondary,
                      '&.Mui-checked': { color: drokexColors.primary },
                    }}
                  />
                }
                label={
                  <Typography variant="body2">
                    Acepto la{' '}
                    <Link href="#" sx={{ color: drokexColors.primary, textDecoration: 'none' }}>
                      política de privacidad
                    </Link>{' '}
                    y el tratamiento de mis datos personales
                  </Typography>
                }
              />
              {errors.acceptPrivacy && (
                <Typography variant="caption" sx={{ color: '#d32f2f', ml: 4 }}>
                  {errors.acceptPrivacy}
                </Typography>
              )}
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <DrokexPattern pattern="diagonal" opacity={0.03}>
      <Box sx={{ minHeight: '100vh', backgroundColor: drokexColors.light, pt: 0, pb: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Public Navbar */}
        <PublicNavbar />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ height: 8 }} />
        <Box
          sx={{
            maxWidth: 800,
            mx: 'auto',
            px: 2,
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <DrokexLogo variant="full" size="large" color="primary" />
            
            {tenant && (
              <Typography 
                variant="h4" 
                sx={{ 
                  mt: 2,
                  mb: 1,
                  color: drokexColors.dark,
                  fontWeight: 600,
                }}
              >
                {getCountryFlag()} Registrar Empresa
              </Typography>
            )}
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: drokexColors.secondary,
                mb: 2
              }}
            >
              Únete a {tenant?.name || 'Drokex'} y conecta con compradores internacionales
            </Typography>

            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: drokexColors.pale,
                color: drokexColors.dark,
                px: 3,
                py: 1,
                borderRadius: 3,
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              ⏱️ Proceso sujeto a aprobación por nuestro equipo
            </Box>
          </Box>

          {/* Stepper */}
          <DrokexCard variant="elevated" sx={{ mb: 3 }}>
            <DrokexCardContent>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel
                      sx={{
                        '& .MuiStepLabel-label': {
                          color: drokexColors.secondary,
                          '&.Mui-active': { color: drokexColors.primary, fontWeight: 600 },
                          '&.Mui-completed': { color: drokexColors.primary },
                        },
                        '& .MuiStepIcon-root': {
                          color: drokexColors.pale,
                          '&.Mui-active': { color: drokexColors.primary },
                          '&.Mui-completed': { color: drokexColors.secondary },
                        },
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </DrokexCardContent>
          </DrokexCard>

          {/* Form */}
          <DrokexCard variant="elevated">
            <DrokexCardContent>
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    backgroundColor: '#ffebee',
                    color: '#d32f2f',
                  }}
                >
                  {error}
                </Alert>
              )}

              {renderStepContent(activeStep)}

              {/* Navigation */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: `1px solid ${drokexColors.pale}` }}>
                <DrokexButton
                  variant="ghost"
                  onClick={handleBack}
                  disabled={activeStep === 0 || isLoading}
                >
                  Anterior
                </DrokexButton>

                {activeStep === steps.length - 1 ? (
                  <DrokexButton
                    variant="primary"
                    onClick={handleSubmit}
                    loading={isLoading}
                    disabled={isSubmitted || isLoading}
                    sx={{ px: 4 }}
                  >
                    Registrar Empresa
                  </DrokexButton>
                ) : (
                  <DrokexButton
                    variant="primary"
                    onClick={handleNext}
                    disabled={isLoading}
                  >
                    Siguiente
                  </DrokexButton>
                )}
              </Box>
            </DrokexCardContent>
          </DrokexCard>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" sx={{ color: drokexColors.secondary }}>
              ¿Ya tienes una cuenta?{' '}
              <Link
                component={RouterLink}
                to="/login"
                sx={{
                  color: drokexColors.primary,
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Iniciar Sesión
              </Link>
            </Typography>
          </Box>
        </Box>
        </Box>
        <PublicFooter />
      </Box>
    </DrokexPattern>
  );
};

export default Register;

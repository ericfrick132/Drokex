import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { tenantService } from '../services/tenantService';

// Tipos para Tenant
export interface DrokexTenant {
  id: number;
  name: string;
  subdomain: string;
  country: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
  planType: string;
  isTrialPeriod: boolean;
  trialEndsAt?: string;
  configuration: {
    primaryColor: string;
    secondaryColor: string;
    currency: string;
    currencySymbol: string;
    timeZone: string;
    languageCode: string;
    transactionFee: number;
    allowsInternationalShipping: boolean;
    customCss?: string;
    logoUrl?: string;
  };
  statistics: {
    totalCompanies: number;
    activeCompanies: number;
    totalProducts: number;
    activeProducts: number;
    totalUsers: number;
    pendingApprovals: number;
    monthlyRevenue: number;
    lastActivity: string;
  };
  drokexBranding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    tagline: string;
  };
}

// Estados del contexto
interface TenantContextState {
  tenant: DrokexTenant | null;
  isLoading: boolean;
  error: string | null;
  
  // Métodos
  loadTenant: () => Promise<void>;
  refreshTenant: () => Promise<void>;
  setTenantFromUrl: (subdomain: string) => void;
  
  // Helpers
  formatCurrency: (amount: number) => string;
  getLocalizedDate: (date: string | Date) => string;
  isTrialExpiring: () => boolean;
  
  // Branding helpers
  getPrimaryColor: () => string;
  getSecondaryColor: () => string;
  getCountryFlag: () => string;
}

// Crear el contexto
const TenantContext = createContext<TenantContextState | undefined>(undefined);

// Props del provider
interface TenantProviderProps {
  children: ReactNode;
}

// Provider del contexto
export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenant, setTenant] = useState<DrokexTenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar tenant actual
  const loadTenant = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const tenantResp = await tenantService.getCurrentTenant();

      if (tenantResp.success) {
        // Normalizar claves (API devuelve PascalCase)
        const api = tenantResp.data as any;
        const normalized: DrokexTenant = {
          id: api.Id,
          name: api.Name,
          subdomain: api.Subdomain,
          country: api.Country,
          countryCode: api.CountryCode,
          currency: api.Currency,
          currencySymbol: api.CurrencySymbol,
          planType: api.PlanType,
          isTrialPeriod: api.IsTrialPeriod,
          trialEndsAt: api.TrialEndsAt,
          configuration: {
            primaryColor: api.Configuration?.PrimaryColor || '#abd305',
            secondaryColor: api.Configuration?.SecondaryColor || '#006d5a',
            currency: api.Configuration?.Currency || api.Currency || 'USD',
            currencySymbol: api.Configuration?.CurrencySymbol || api.CurrencySymbol || '$',
            timeZone: api.Configuration?.TimeZone || 'UTC',
            languageCode: api.Configuration?.LanguageCode || 'es',
            transactionFee: api.Configuration?.TransactionFee || 0,
            allowsInternationalShipping: !!api.Configuration?.AllowsInternationalShipping,
            customCss: api.Configuration?.CustomCss,
            logoUrl: api.Configuration?.LogoUrl,
          },
          statistics: {
            totalCompanies: api.Statistics?.TotalCompanies || 0,
            activeCompanies: api.Statistics?.ActiveCompanies || 0,
            totalProducts: api.Statistics?.TotalProducts || 0,
            activeProducts: api.Statistics?.ActiveProducts || 0,
            totalUsers: api.Statistics?.TotalUsers || 0,
            pendingApprovals: api.Statistics?.PendingApprovals || 0,
            monthlyRevenue: api.Statistics?.MonthlyRevenue || 0,
            lastActivity: api.Statistics?.LastActivity || new Date().toISOString(),
          },
          drokexBranding: {
            primaryColor: api.DrokexBranding?.PrimaryColor || '#abd305',
            secondaryColor: api.DrokexBranding?.SecondaryColor || '#006d5a',
            logoUrl: api.DrokexBranding?.LogoUrl || '',
            tagline: api.DrokexBranding?.Tagline || 'Connecting LATAM Businesses',
          }
        };

        setTenant(normalized);

        // Aplicar tema CSS personalizado
        applyTenantTheme(normalized);


        console.log(`✅ Drokex Tenant cargado: ${normalized.name} (${normalized.subdomain})`);
      } else {
        setError((tenantResp as any).message || 'Error cargando tenant');
        console.warn('⚠️ No se pudo cargar el tenant Drokex');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      console.error('❌ Error cargando tenant:', err);
      
      // Intentar cargar desde cache
      tryLoadFromCache();
    } finally {
      setIsLoading(false);
    }
  };

  // Refrescar tenant
  const refreshTenant = async () => {
    await loadTenant();
  };

  // Establecer tenant desde URL
  const setTenantFromUrl = (_subdomain: string) => {
    // Obsoleto: el tenant se resuelve por subdominio del host.
    loadTenant();
  };

  // Intentar cargar desde cache
  const tryLoadFromCache = () => {
    try {
      const cachedTenant = localStorage.getItem('drokex-tenant');
      if (cachedTenant) {
        const tenantData = JSON.parse(cachedTenant);
        setTenant(tenantData);
        applyTenantTheme(tenantData);
        console.log('📦 Tenant cargado desde cache');
      }
    } catch (err) {
      console.warn('⚠️ Error cargando tenant desde cache:', err);
    }
  };

  // Aplicar tema CSS del tenant
  const applyTenantTheme = (tenantData: DrokexTenant) => {
    const root = document.documentElement;
    
    // Aplicar colores del tenant
    root.style.setProperty('--drokex-primary', tenantData.configuration?.primaryColor || '#abd305');
    root.style.setProperty('--drokex-secondary', tenantData.configuration?.secondaryColor || '#006d5a');
    
    // Establecer atributo de tenant en el body para estilos específicos
    document.body.setAttribute('data-tenant', tenantData.subdomain);
    document.body.setAttribute('data-country', tenantData.countryCode.toLowerCase());
    
    // CSS personalizado si existe
    if (tenantData.configuration?.customCss) {
      let customStyleElement = document.getElementById('drokex-custom-css');
      if (!customStyleElement) {
        customStyleElement = document.createElement('style');
        customStyleElement.id = 'drokex-custom-css';
        document.head.appendChild(customStyleElement);
      }
      customStyleElement.textContent = tenantData.configuration.customCss;
    }

    // Actualizar meta tags
    document.title = `${tenantData.name} - Drokex`;
    
    // Actualizar favicon si hay logo personalizado
    if (tenantData.configuration?.logoUrl) {
      const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = tenantData.configuration.logoUrl;
      }
    }
  };

  // Helper: formatear moneda
  const formatCurrency = (amount: number): string => {
    if (!tenant) return `$${amount.toFixed(2)}`;
    
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: tenant.configuration.currency,
      currencyDisplay: 'symbol'
    }).format(amount);
  };

  // Helper: fecha localizada
  const getLocalizedDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (!tenant) return dateObj.toLocaleDateString();
    
    return dateObj.toLocaleDateString('es-US', {
      timeZone: tenant.configuration.timeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper: verificar si el trial expira pronto
  const isTrialExpiring = (): boolean => {
    if (!tenant || !tenant.isTrialPeriod || !tenant.trialEndsAt) return false;
    
    const trialEnd = new Date(tenant.trialEndsAt);
    const today = new Date();
    const daysLeft = Math.ceil((trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysLeft <= 7; // Expira en 7 días o menos
  };

  // Helper: obtener color primario
  const getPrimaryColor = (): string => {
    return tenant?.configuration.primaryColor || '#abd305';
  };

  // Helper: obtener color secundario
  const getSecondaryColor = (): string => {
    return tenant?.configuration.secondaryColor || '#006d5a';
  };

  // Helper: obtener emoji de bandera del país
  const getCountryFlag = (): string => {
    const flags: Record<string, string> = {
      'HN': '🇭🇳', // Honduras
      'GT': '🇬🇹', // Guatemala
      'MX': '🇲🇽', // México
      'DO': '🇩🇴', // República Dominicana
      'SV': '🇸🇻'  // El Salvador
    };
    
    return tenant ? flags[tenant.countryCode] || '🌎' : '🌎';
  };

  // Detectar tenant desde URL al cargar
  useEffect(() => {
    const detectTenantFromUrl = () => {
      // Detectar desde subdomain (prod: sub.drokex.com; dev: sub.localhost)
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      if (
        (parts.length >= 3 && parts[1] === 'drokex' && parts[2] === 'com') ||
        (parts.length >= 2 && parts[parts.length - 1] === 'localhost')
      ) {
        const subdomain = parts[0];
        if (!['www', 'api', 'admin', 'app'].includes(subdomain)) {
          // Sólo usamos el subdominio para llamadas
          console.log(`🌎 Subdomain detectado: ${subdomain}`);
        }
      }
    };

    detectTenantFromUrl();
    loadTenant();
  }, []);

  // Valores del contexto
  const contextValue: TenantContextState = {
    tenant,
    isLoading,
    error,
    loadTenant,
    refreshTenant,
    setTenantFromUrl,
    formatCurrency,
    getLocalizedDate,
    isTrialExpiring,
    getPrimaryColor,
    getSecondaryColor,
    getCountryFlag
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

// Hook para usar el contexto
export const useTenant = (): TenantContextState => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// Hook para verificar si hay tenant
export const useHasTenant = (): boolean => {
  const { tenant } = useTenant();
  return tenant !== null;
};

// Hook para información específica del tenant
export const useTenantInfo = () => {
  const { tenant } = useTenant();
  
  return {
    isHonduras: tenant?.countryCode === 'HN',
    isGuatemala: tenant?.countryCode === 'GT',
    isMexico: tenant?.countryCode === 'MX',
    isDominicana: tenant?.countryCode === 'DO',
    isElSalvador: tenant?.countryCode === 'SV',
    countryName: tenant?.country || 'Unknown',
    marketplaceUrl: tenant ? `https://${tenant.subdomain}.drokex.com` : '',
    devUrl: tenant ? `http://localhost:3100?tenant=${tenant.subdomain}` : ''
  };
};

export interface CountryInfo {
  name: string;
  code: string; // ISO 3166-1 alpha-2
  dialCode: string; // e.g. +504
  currency?: string; // e.g. HNL
  currencySymbol?: string; // e.g. L
}

// Compact world list covering all LATAM + top markets. Can be extended easily.
export const COUNTRIES: CountryInfo[] = [
  // LATAM (priority)
  { name: 'Argentina', code: 'AR', dialCode: '+54', currency: 'ARS', currencySymbol: '$' },
  { name: 'Bolivia', code: 'BO', dialCode: '+591', currency: 'BOB', currencySymbol: 'Bs' },
  { name: 'Brasil', code: 'BR', dialCode: '+55', currency: 'BRL', currencySymbol: 'R$' },
  { name: 'Chile', code: 'CL', dialCode: '+56', currency: 'CLP', currencySymbol: '$' },
  { name: 'Colombia', code: 'CO', dialCode: '+57', currency: 'COP', currencySymbol: '$' },
  { name: 'Costa Rica', code: 'CR', dialCode: '+506', currency: 'CRC', currencySymbol: '₡' },
  { name: 'Cuba', code: 'CU', dialCode: '+53', currency: 'CUP', currencySymbol: '$' },
  { name: 'República Dominicana', code: 'DO', dialCode: '+1', currency: 'DOP', currencySymbol: 'RD$' },
  { name: 'Ecuador', code: 'EC', dialCode: '+593', currency: 'USD', currencySymbol: '$' },
  { name: 'El Salvador', code: 'SV', dialCode: '+503', currency: 'USD', currencySymbol: '$' },
  { name: 'Guatemala', code: 'GT', dialCode: '+502', currency: 'GTQ', currencySymbol: 'Q' },
  { name: 'Honduras', code: 'HN', dialCode: '+504', currency: 'HNL', currencySymbol: 'L' },
  { name: 'México', code: 'MX', dialCode: '+52', currency: 'MXN', currencySymbol: '$' },
  { name: 'Nicaragua', code: 'NI', dialCode: '+505', currency: 'NIO', currencySymbol: 'C$' },
  { name: 'Panamá', code: 'PA', dialCode: '+507', currency: 'PAB', currencySymbol: 'B/.' },
  { name: 'Paraguay', code: 'PY', dialCode: '+595', currency: 'PYG', currencySymbol: '₲' },
  { name: 'Perú', code: 'PE', dialCode: '+51', currency: 'PEN', currencySymbol: 'S/' },
  { name: 'Uruguay', code: 'UY', dialCode: '+598', currency: 'UYU', currencySymbol: '$' },
  { name: 'Venezuela', code: 'VE', dialCode: '+58', currency: 'VES', currencySymbol: 'Bs.' },

  // North America
  { name: 'Estados Unidos', code: 'US', dialCode: '+1', currency: 'USD', currencySymbol: '$' },
  { name: 'Canadá', code: 'CA', dialCode: '+1', currency: 'CAD', currencySymbol: '$' },
  { name: 'México', code: 'MX', dialCode: '+52', currency: 'MXN', currencySymbol: '$' },

  // Europe (selected)
  { name: 'España', code: 'ES', dialCode: '+34', currency: 'EUR', currencySymbol: '€' },
  { name: 'Portugal', code: 'PT', dialCode: '+351', currency: 'EUR', currencySymbol: '€' },
  { name: 'Alemania', code: 'DE', dialCode: '+49', currency: 'EUR', currencySymbol: '€' },
  { name: 'Francia', code: 'FR', dialCode: '+33', currency: 'EUR', currencySymbol: '€' },
  { name: 'Italia', code: 'IT', dialCode: '+39', currency: 'EUR', currencySymbol: '€' },
  { name: 'Reino Unido', code: 'GB', dialCode: '+44', currency: 'GBP', currencySymbol: '£' },
  { name: 'Países Bajos', code: 'NL', dialCode: '+31', currency: 'EUR', currencySymbol: '€' },
  { name: 'Polonia', code: 'PL', dialCode: '+48', currency: 'PLN', currencySymbol: 'zł' },

  // Asia (selected)
  { name: 'China', code: 'CN', dialCode: '+86', currency: 'CNY', currencySymbol: '¥' },
  { name: 'Japón', code: 'JP', dialCode: '+81', currency: 'JPY', currencySymbol: '¥' },
  { name: 'Corea del Sur', code: 'KR', dialCode: '+82', currency: 'KRW', currencySymbol: '₩' },
  { name: 'India', code: 'IN', dialCode: '+91', currency: 'INR', currencySymbol: '₹' },
  { name: 'Emiratos Árabes Unidos', code: 'AE', dialCode: '+971', currency: 'AED', currencySymbol: 'د.إ' },
  { name: 'Turquía', code: 'TR', dialCode: '+90', currency: 'TRY', currencySymbol: '₺' },

  // Africa (selected)
  { name: 'Sudáfrica', code: 'ZA', dialCode: '+27', currency: 'ZAR', currencySymbol: 'R' },
  { name: 'Marruecos', code: 'MA', dialCode: '+212', currency: 'MAD', currencySymbol: 'د.م.' },
  { name: 'Egipto', code: 'EG', dialCode: '+20', currency: 'EGP', currencySymbol: '£' },

  // Oceania
  { name: 'Australia', code: 'AU', dialCode: '+61', currency: 'AUD', currencySymbol: '$' },
  { name: 'Nueva Zelanda', code: 'NZ', dialCode: '+64', currency: 'NZD', currencySymbol: '$' },
];

export const findCountryByCode = (code?: string) => COUNTRIES.find(c => c.code === code);
export const findCountryByName = (name?: string) => COUNTRIES.find(c => c.name.toLowerCase() === (name || '').toLowerCase());


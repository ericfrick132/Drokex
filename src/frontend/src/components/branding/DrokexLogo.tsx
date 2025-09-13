import React from 'react';
import { useTenant } from '../../contexts/TenantContext';

interface DrokexLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'symbol' | 'text';
  showCountry?: boolean;
  className?: string;
}

export const DrokexLogo: React.FC<DrokexLogoProps> = ({
  size = 'md',
  variant = 'full',
  showCountry = false,
  className = ''
}) => {
  const { tenant, getPrimaryColor, getSecondaryColor, getCountryFlag } = useTenant();

  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  };

  // SVG del símbolo Drokex (D + flecha)
  const DrokexSymbol = () => (
    <svg 
      className={sizeClasses[size]}
      viewBox="0 0 60 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Círculo base */}
      <circle 
        cx="30" 
        cy="30" 
        r="28" 
        fill={getPrimaryColor()} 
        stroke={getSecondaryColor()} 
        strokeWidth="2"
      />
      
      {/* Letra D estilizada */}
      <path 
        d="M18 15 h8 c8 0 12 4 12 15 s-4 15-12 15 h-8 z M18 20 h6 c4 0 6 2 6 10 s-2 10-6 10 h-6 z" 
        fill="white"
      />
      
      {/* Flecha integrada */}
      <path 
        d="M35 25 l8 5 l-8 5 l3 -2.5 l0 -5 l-3 -2.5 z" 
        fill={getSecondaryColor()}
      />
    </svg>
  );

  // Texto Drokex con fuente de marca
  const DrokexText = () => (
    <span 
      className={`font-bold ${textSizeClasses[size]} drokex-heading`}
      style={{ color: getPrimaryColor() }}
    >
      Drokex
    </span>
  );

  // País/región si está habilitado
  const CountryText = () => {
    if (!showCountry || !tenant) return null;
    
    return (
      <span 
        className="text-sm font-medium ml-2 drokex-body"
        style={{ color: getSecondaryColor() }}
      >
        {getCountryFlag()} {tenant.country}
      </span>
    );
  };

  return (
    <div className={`drokex-flex drokex-items-center drokex-gap-2 ${className}`}>
      {/* Símbolo */}
      {(variant === 'full' || variant === 'symbol') && <DrokexSymbol />}
      
      {/* Texto */}
      {(variant === 'full' || variant === 'text') && (
        <div className="drokex-flex drokex-flex-col">
          <DrokexText />
          <CountryText />
        </div>
      )}
    </div>
  );
};

// Componente para logo personalizado del tenant
export const TenantLogo: React.FC<DrokexLogoProps> = (props) => {
  const { tenant } = useTenant();
  
  // Si el tenant tiene logo personalizado, usarlo
  if (tenant?.configuration?.logoUrl) {
    return (
      <img 
        src={tenant.configuration.logoUrl}
        alt={`${tenant.name} Logo`}
        className={`${props.className} max-h-${props.size === 'sm' ? '8' : props.size === 'lg' ? '16' : '12'}`}
      />
    );
  }
  
  // Si no, usar logo Drokex por defecto
  return <DrokexLogo {...props} />;
};

// Componente para patrones de marca
export const DrokexPattern: React.FC<{
  type: 'arrow' | 'diamond' | 'chevron';
  className?: string;
}> = ({ type, className = '' }) => {
  const { getPrimaryColor, getSecondaryColor } = useTenant();

  const patterns = {
    arrow: (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <defs>
          <pattern id="arrowPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M10 0L20 10L10 20L0 10Z" fill={getPrimaryColor()} fillOpacity="0.1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#arrowPattern)"/>
      </svg>
    ),
    
    diamond: (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <defs>
          <pattern id="diamondPattern" x="0" y="0" width="15" height="15" patternUnits="userSpaceOnUse">
            <path d="M7.5 0L15 7.5L7.5 15L0 7.5Z" fill={getSecondaryColor()} fillOpacity="0.05"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#diamondPattern)"/>
      </svg>
    ),
    
    chevron: (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <defs>
          <pattern id="chevronPattern" x="0" y="0" width="25" height="10" patternUnits="userSpaceOnUse">
            <path d="M0 5L12.5 0L25 5L12.5 10Z" fill={getPrimaryColor()} fillOpacity="0.08"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#chevronPattern)"/>
      </svg>
    )
  };

  return patterns[type];
};

// Componente para gradiente de marca
export const DrokexGradient: React.FC<{
  direction?: 'to-r' | 'to-br' | 'to-b';
  className?: string;
  children: React.ReactNode;
}> = ({ direction = 'to-br', className = '', children }) => {
  const { getPrimaryColor, getSecondaryColor } = useTenant();
  
  const gradientStyle = {
    background: `linear-gradient(${direction === 'to-r' ? 'to right' : direction === 'to-b' ? 'to bottom' : 'to bottom right'}, ${getPrimaryColor()}, ${getSecondaryColor()})`
  };

  return (
    <div 
      className={`${className}`}
      style={gradientStyle}
    >
      {children}
    </div>
  );
};

export default DrokexLogo;
import React from 'react';
import { Box } from '@mui/material';

interface DrokexLogoProps {
  variant?: 'full' | 'symbol' | 'text';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white' | 'dark';
  withMargin?: boolean;
}

const DrokexLogo: React.FC<DrokexLogoProps> = ({
  variant = 'full',
  size = 'medium',
  color = 'primary',
  withMargin = true
}) => {
  const sizeMap = {
    small: { logo: '1.5rem', text: '1.2rem' },
    medium: { logo: '2rem', text: '1.6rem' },
    large: { logo: '3rem', text: '2.4rem' }
  } as const;

  const currentSize = sizeMap[size];

  // Mapear el color solicitado a la variante de archivo
  // No hay versión blanca provista; usamos verde como fallback
  const colorSuffix = ((): 'verde' | 'negro' => {
    if (color === 'dark') return 'negro';
    return 'verde';
  })();

  const fileName = (() => {
    const base = variant === 'symbol' ? 'logo-d' : 'logo-entero';
    return `${base}-${colorSuffix}.png`;
  })();

  const src = `${process.env.PUBLIC_URL || ''}/assets/${fileName}`;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        // Zona de resguardo según styleguide.txt
        padding: withMargin ? `${currentSize.logo}` : 0,
        minHeight: currentSize.logo,
      }}
    >
      <Box
        component="img"
        src={src}
        alt={variant === 'symbol' ? 'Drokex Logo Symbol' : 'Drokex Logo'}
        sx={{
          height: variant === 'symbol' ? currentSize.logo : currentSize.text,
          display: 'inline-block',
        }}
      />
    </Box>
  );
};

export default DrokexLogo;

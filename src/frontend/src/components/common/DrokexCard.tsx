import React from 'react';
import { Card, CardProps, CardContent, CardActions, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { drokexColors } from '../../theme/drokexTheme';

interface DrokexCardProps extends Omit<CardProps, 'variant'> {
  variant?: 'default' | 'bordered' | 'elevated' | 'interactive';
  borderColor?: 'primary' | 'secondary' | 'pale';
  children: React.ReactNode;
}

const StyledCard = styled(Card)<{ 
  drokexvariant: string; 
  drokexbordercolor?: string;
}>(({ theme, drokexvariant, drokexbordercolor }) => {
  const baseStyles = {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    transition: 'all 0.2s ease-in-out',
  };

  const borderColorMap = {
    primary: drokexColors.primary,
    secondary: drokexColors.secondary,
    pale: drokexColors.pale,
  };

  switch (drokexvariant) {
    case 'default':
      return {
        ...baseStyles,
        boxShadow: '0 1px 3px rgba(22, 22, 22, 0.12), 0 1px 2px rgba(22, 22, 22, 0.24)',
      };

    case 'bordered':
      return {
        ...baseStyles,
        border: `2px solid ${borderColorMap[drokexbordercolor as keyof typeof borderColorMap] || drokexColors.primary}`,
        boxShadow: 'none',
      };

    case 'elevated':
      return {
        ...baseStyles,
        boxShadow: '0 4px 8px rgba(22, 22, 22, 0.15), 0 2px 4px rgba(22, 22, 22, 0.12)',
      };

    case 'interactive':
      return {
        ...baseStyles,
        boxShadow: '0 1px 3px rgba(22, 22, 22, 0.12), 0 1px 2px rgba(22, 22, 22, 0.24)',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(22, 22, 22, 0.15), 0 2px 4px rgba(22, 22, 22, 0.12)',
          transform: 'translateY(-2px)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      };

    default:
      return baseStyles;
  }
});

const DrokexCard: React.FC<DrokexCardProps> = ({
  children,
  variant = 'default',
  borderColor = 'primary',
  ...props
}) => {
  return (
    <StyledCard
      drokexvariant={variant}
      drokexbordercolor={borderColor}
      {...props}
    >
      {children}
    </StyledCard>
  );
};

// Componentes relacionados para facilitar uso
export const DrokexCardContent = ({ children, ...props }: any) => (
  <CardContent sx={{ padding: '24px', '&:last-child': { paddingBottom: '24px' } }} {...props}>
    {children}
  </CardContent>
);

export const DrokexCardActions = ({ children, ...props }: any) => (
  <CardActions sx={{ padding: '16px 24px', paddingTop: 0 }} {...props}>
    <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
      {children}
    </Box>
  </CardActions>
);

export default DrokexCard;
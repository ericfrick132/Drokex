import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { drokexColors } from '../../theme/drokexTheme';

interface DrokexButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  fullWidth?: boolean;
}

const StyledButton = styled(Button)<{ drokexvariant: string }>(({ theme, drokexvariant }) => {
  const baseStyles = {
    fontFamily: '"Manrope", sans-serif',
    fontWeight: 500,
    textTransform: 'none' as const,
    borderRadius: 8,
    padding: '12px 24px',
    fontSize: '1rem',
    lineHeight: 1.5,
    minHeight: 44,
    transition: 'all 0.2s ease-in-out',
  };

  switch (drokexvariant) {
    case 'primary':
      return {
        ...baseStyles,
        backgroundColor: drokexColors.primary,
        color: drokexColors.dark,
        border: `2px solid ${drokexColors.primary}`,
        boxShadow: '0 2px 4px rgba(171, 211, 5, 0.2)',
        '&:hover': {
          backgroundColor: drokexColors.secondary,
          borderColor: drokexColors.secondary,
          color: '#ffffff',
          boxShadow: '0 4px 8px rgba(0, 109, 90, 0.3)',
          transform: 'translateY(-1px)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
        '&:disabled': {
          backgroundColor: drokexColors.pale,
          color: '#999',
          borderColor: drokexColors.pale,
          boxShadow: 'none',
        },
      };

    case 'secondary':
      return {
        ...baseStyles,
        backgroundColor: drokexColors.secondary,
        color: '#ffffff',
        border: `2px solid ${drokexColors.secondary}`,
        boxShadow: '0 2px 4px rgba(0, 109, 90, 0.2)',
        '&:hover': {
          backgroundColor: drokexColors.primary,
          borderColor: drokexColors.primary,
          color: drokexColors.dark,
          boxShadow: '0 4px 8px rgba(171, 211, 5, 0.3)',
          transform: 'translateY(-1px)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
        '&:disabled': {
          backgroundColor: '#ccc',
          color: '#999',
          borderColor: '#ccc',
          boxShadow: 'none',
        },
      };

    case 'outline':
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        color: drokexColors.primary,
        border: `2px solid ${drokexColors.primary}`,
        '&:hover': {
          backgroundColor: drokexColors.primary,
          color: drokexColors.dark,
          transform: 'translateY(-1px)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
        '&:disabled': {
          color: '#ccc',
          borderColor: '#ccc',
        },
      };

    case 'ghost':
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        color: drokexColors.secondary,
        border: '2px solid transparent',
        '&:hover': {
          backgroundColor: 'rgba(0, 109, 90, 0.04)',
          color: drokexColors.secondary,
        },
        '&:disabled': {
          color: '#ccc',
        },
      };

    default:
      return baseStyles;
  }
});

const DrokexButton: React.FC<DrokexButtonProps> = ({
  children,
  variant = 'primary',
  loading = false,
  disabled,
  fullWidth = false,
  ...props
}) => {
  return (
    <StyledButton
      drokexvariant={variant}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : props.startIcon}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default DrokexButton;
import React from 'react';
import { TextField, TextFieldProps, InputAdornment } from '@mui/material';
import { styled } from '@mui/material/styles';
import { drokexColors } from '../../theme/drokexTheme';

interface DrokexInputProps extends Omit<TextFieldProps, 'variant'> {
  variant?: 'outlined' | 'filled';
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputLabel-root': {
    fontFamily: '"Manrope", sans-serif',
    fontWeight: 400,
    color: drokexColors.secondary,
    '&.Mui-focused': {
      color: drokexColors.secondary,
      fontWeight: 500,
    },
  },
  '& .MuiOutlinedInput-root': {
    fontFamily: '"Manrope", sans-serif',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    '& fieldset': {
      borderColor: '#e0e0e0',
      borderWidth: 2,
    },
    '&:hover fieldset': {
      borderColor: drokexColors.pale,
    },
    '&.Mui-focused fieldset': {
      borderColor: drokexColors.secondary,
      borderWidth: 2,
    },
    '&.Mui-error fieldset': {
      borderColor: '#d32f2f',
    },
    '& input': {
      padding: '12px 14px',
      fontSize: '1rem',
      '&::placeholder': {
        color: '#999',
        opacity: 1,
      },
    },
  },
  '& .MuiFilledInput-root': {
    fontFamily: '"Manrope", sans-serif',
    backgroundColor: drokexColors.light,
    borderRadius: '8px 8px 0 0',
    '&:before': {
      borderBottomColor: drokexColors.pale,
      borderBottomWidth: 2,
    },
    '&:hover:before': {
      borderBottomColor: drokexColors.secondary,
    },
    '&.Mui-focused:after': {
      borderBottomColor: drokexColors.secondary,
      borderBottomWidth: 2,
    },
    '& input': {
      padding: '12px 12px 8px',
      fontSize: '1rem',
    },
  },
  '& .MuiFormHelperText-root': {
    fontFamily: '"Manrope", sans-serif',
    fontSize: '0.75rem',
    marginTop: 6,
    '&.Mui-error': {
      color: '#d32f2f',
    },
  },
}));

const DrokexInput: React.FC<DrokexInputProps> = ({
  variant = 'outlined',
  icon,
  iconPosition = 'start',
  InputProps,
  ...props
}) => {
  const inputProps = icon ? {
    ...InputProps,
    [iconPosition === 'start' ? 'startAdornment' : 'endAdornment']: (
      <InputAdornment position={iconPosition}>
        {icon}
      </InputAdornment>
    ),
  } : InputProps;

  return (
    <StyledTextField
      variant={variant}
      fullWidth
      InputProps={inputProps}
      {...props}
    />
  );
};

export default DrokexInput;
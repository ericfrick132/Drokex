import React from 'react';
import { Card, CardContent, Typography, Box, IconButton } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { drokexColors } from '../../theme/drokexTheme';

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
  onClick: () => void;
}

interface QuickActionCardProps {
  action: QuickAction;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ action }) => {
  const getColorScheme = () => {
    switch (action.color) {
      case 'primary':
        return { 
          bg: drokexColors.primary, 
          text: drokexColors.dark,
          hover: drokexColors.secondary
        };
      case 'secondary':
        return { 
          bg: drokexColors.secondary, 
          text: '#ffffff',
          hover: drokexColors.primary
        };
      case 'success':
        return { 
          bg: '#4caf50', 
          text: '#ffffff',
          hover: '#45a049'
        };
      case 'warning':
        return { 
          bg: '#ff9800', 
          text: '#ffffff',
          hover: '#f57c00'
        };
      case 'info':
        return { 
          bg: '#2196f3', 
          text: '#ffffff',
          hover: '#1976d2'
        };
      default:
        return { 
          bg: drokexColors.primary, 
          text: drokexColors.dark,
          hover: drokexColors.secondary
        };
    }
  };

  const colorScheme = getColorScheme();
  // Solo la acción "Añadir Producto" debe ir con fondo de color
  const isPrimaryAction = /(añadir|anadir)\s+producto/i.test(action.title);

  return (
    <Card
      onClick={action.onClick}
      sx={{
        height: '100%',
        cursor: 'pointer',
        background: isPrimaryAction
          ? `linear-gradient(135deg, ${colorScheme.bg} 0%, ${colorScheme.bg}dd 100%)`
          : 'linear-gradient(135deg, #ffffff 0%, #ffffff 100%)',
        color: isPrimaryAction ? colorScheme.text : drokexColors.dark,
        border: isPrimaryAction ? 'none' : `1px solid ${colorScheme.bg}55`,
        borderLeft: isPrimaryAction ? undefined : `4px solid ${colorScheme.bg}`,
        borderRadius: 3,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: isPrimaryAction
            ? `0 12px 30px ${colorScheme.bg}40`
            : `0 8px 20px ${colorScheme.bg}25`,
          background: isPrimaryAction
            ? `linear-gradient(135deg, ${colorScheme.hover} 0%, ${colorScheme.hover}dd 100%)`
            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          '& .action-arrow': {
            transform: 'translateX(4px)',
          }
        },
        '&:before': isPrimaryAction ? {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '60px',
          height: '60px',
          background: `linear-gradient(135deg, transparent 40%, ${colorScheme.text}10 100%)`,
          borderRadius: '0 0 0 100%',
        } : undefined
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box
            sx={{
              color: isPrimaryAction ? colorScheme.text : colorScheme.bg,
              opacity: isPrimaryAction ? 0.9 : 1,
              fontSize: '2rem',
            }}
          >
            {action.icon}
          </Box>
          
          <IconButton
            className="action-arrow"
            size="small"
            sx={{
              color: isPrimaryAction ? colorScheme.text : colorScheme.bg,
              opacity: isPrimaryAction ? 0.7 : 1,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: isPrimaryAction ? `${colorScheme.text}20` : `${colorScheme.bg}15`,
              }
            }}
          >
            <ArrowForward fontSize="small" />
          </IconButton>
        </Box>

        <Box flex={1} display="flex" flexDirection="column" justifyContent="space-between">
          <Typography
            variant="h6"
            sx={{
              color: isPrimaryAction ? colorScheme.text : drokexColors.dark,
              fontWeight: 600,
              mb: 1,
              lineHeight: 1.3
            }}
          >
            {action.title}
          </Typography>
          
          <Typography
            variant="body2"
            sx={{
              color: isPrimaryAction ? colorScheme.text : '#4b5563',
              opacity: isPrimaryAction ? 0.8 : 1,
              lineHeight: 1.4
            }}
          >
            {action.description}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default QuickActionCard;

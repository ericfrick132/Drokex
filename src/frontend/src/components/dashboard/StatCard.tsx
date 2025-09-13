import React from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';
import { drokexColors } from '../../theme/drokexTheme';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend
}) => {
  const getColorScheme = () => {
    switch (color) {
      case 'primary':
        return { bg: drokexColors.primary, text: drokexColors.dark };
      case 'secondary':
        return { bg: drokexColors.secondary, text: '#ffffff' };
      case 'success':
        return { bg: '#4caf50', text: '#ffffff' };
      case 'warning':
        return { bg: '#ff9800', text: '#ffffff' };
      case 'error':
        return { bg: '#f44336', text: '#ffffff' };
      case 'info':
        return { bg: '#2196f3', text: '#ffffff' };
      default:
        return { bg: drokexColors.primary, text: drokexColors.dark };
    }
  };

  const colorScheme = getColorScheme();

  return (
    <Card
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: `1px solid ${drokexColors.pale}`,
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px rgba(171, 211, 5, 0.15)`,
          borderColor: drokexColors.primary,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box flex={1}>
            <Typography
              variant="body2"
              sx={{
                color: drokexColors.secondary,
                fontWeight: 500,
                mb: 1,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.75rem'
              }}
            >
              {title}
            </Typography>
            
            <Typography
              variant="h4"
              sx={{
                color: drokexColors.dark,
                fontWeight: 400,
                mb: subtitle || trend ? 1 : 0,
                lineHeight: 1.2
              }}
            >
              {value}
            </Typography>
            
            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: drokexColors.secondary,
                  fontWeight: 400
                }}
              >
                {subtitle}
              </Typography>
            )}
            
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                <Typography
                  variant="body2"
                  sx={{
                    color: trend.isPositive ? '#4caf50' : '#f44336',
                    fontWeight: 600,
                    fontSize: '0.8rem'
                  }}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: drokexColors.secondary,
                    ml: 1,
                    fontSize: '0.8rem'
                  }}
                >
                  vs mes anterior
                </Typography>
              </Box>
            )}
          </Box>
          
          {icon && (
            <Avatar
              sx={{
                bgcolor: colorScheme.bg,
                color: colorScheme.text,
                width: 56,
                height: 56,
                ml: 2
              }}
            >
              {icon}
            </Avatar>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;

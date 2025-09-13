import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { drokexColors } from '../../theme/drokexTheme';

interface DrokexPatternProps extends BoxProps {
  pattern?: 'arrows' | 'diamond' | 'chevron' | 'diagonal' | 'gradient';
  opacity?: number;
  size?: 'small' | 'medium' | 'large';
}

const DrokexPattern: React.FC<DrokexPatternProps> = ({
  pattern = 'arrows',
  opacity = 0.1,
  size = 'medium',
  children,
  sx,
  ...props
}) => {
  const sizeMap = {
    small: 20,
    medium: 40,
    large: 60,
  };

  const patternSize = sizeMap[size];

  const generatePattern = () => {
    const patternId = `drokex-pattern-${pattern}-${size}`;

    switch (pattern) {
      case 'arrows':
        return (
          <defs>
            <pattern
              id={patternId}
              patternUnits="userSpaceOnUse"
              width={patternSize}
              height={patternSize}
            >
              <polygon
                points={`${patternSize * 0.2},${patternSize * 0.3} ${patternSize * 0.5},${patternSize * 0.5} ${patternSize * 0.2},${patternSize * 0.7}`}
                fill={drokexColors.primary}
                opacity={opacity}
              />
              <polygon
                points={`${patternSize * 0.7},${patternSize * 0.1} ${patternSize * 0.9},${patternSize * 0.3} ${patternSize * 0.7},${patternSize * 0.5}`}
                fill={drokexColors.secondary}
                opacity={opacity}
              />
            </pattern>
          </defs>
        );

      case 'diamond':
        return (
          <defs>
            <pattern
              id={patternId}
              patternUnits="userSpaceOnUse"
              width={patternSize}
              height={patternSize}
            >
              <polygon
                points={`${patternSize * 0.5},${patternSize * 0.1} ${patternSize * 0.9},${patternSize * 0.5} ${patternSize * 0.5},${patternSize * 0.9} ${patternSize * 0.1},${patternSize * 0.5}`}
                fill={drokexColors.primary}
                opacity={opacity}
              />
            </pattern>
          </defs>
        );

      case 'chevron':
        return (
          <defs>
            <pattern
              id={patternId}
              patternUnits="userSpaceOnUse"
              width={patternSize}
              height={patternSize / 2}
            >
              <polyline
                points={`0,${patternSize * 0.15} ${patternSize * 0.25},0 ${patternSize * 0.5},${patternSize * 0.15} ${patternSize * 0.75},0 ${patternSize},${patternSize * 0.15}`}
                stroke={drokexColors.primary}
                strokeWidth="2"
                fill="none"
                opacity={opacity}
              />
            </pattern>
          </defs>
        );

      case 'diagonal':
        return (
          <defs>
            <pattern
              id={patternId}
              patternUnits="userSpaceOnUse"
              width={patternSize}
              height={patternSize}
            >
              <line
                x1="0"
                y1={patternSize}
                x2={patternSize}
                y2="0"
                stroke={drokexColors.primary}
                strokeWidth="2"
                opacity={opacity}
              />
            </pattern>
          </defs>
        );

      case 'gradient':
        return (
          <defs>
            <linearGradient id={patternId} gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={drokexColors.primary} stopOpacity={opacity} />
              <stop offset="100%" stopColor={drokexColors.secondary} stopOpacity={opacity / 2} />
            </linearGradient>
          </defs>
        );

      default:
        return null;
    }
  };

  const getFillUrl = () => {
    const patternId = `drokex-pattern-${pattern}-${size}`;
    return pattern === 'gradient' ? `url(#${patternId})` : `url(#${patternId})`;
  };

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        ...sx,
      }}
      {...props}
    >
      {/* SVG Pattern Background */}
      <Box
        component="svg"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        {generatePattern()}
        <rect width="100%" height="100%" fill={getFillUrl()} />
      </Box>

      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {children}
      </Box>
    </Box>
  );
};

export default DrokexPattern;
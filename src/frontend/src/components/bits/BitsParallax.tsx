import React, { useEffect, useMemo, useState } from 'react';
import { Box, BoxProps } from '@mui/material';

interface BitsParallaxProps extends BoxProps {
  strength?: number;
}

const BitsParallax: React.FC<BitsParallaxProps> = ({ children, strength = 40, sx, ...props }) => {
  const [Mod, setMod] = useState<any | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await import('react-bits');
        if (!mounted) return;
        setMod(m);
      } catch {
        setMod(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const Comp = useMemo(() => {
    if (!Mod) return null;
    return Mod.Parallax || Mod.ParallaxScroll || Mod.ParallaxLayer || null;
  }, [Mod]);

  if (Comp) {
    const propsMap: any = { strength };
    return (
      <Comp {...propsMap}>
        <Box sx={sx} {...props}>
          {children}
        </Box>
      </Comp>
    );
  }

  return (
    <Box sx={sx} {...props}>
      {children}
    </Box>
  );
};

export default BitsParallax;


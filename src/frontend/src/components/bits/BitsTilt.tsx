import React, { useEffect, useMemo, useState } from 'react';
import { Box, BoxProps } from '@mui/material';

interface BitsTiltProps extends BoxProps {
  scale?: number;
}

const BitsTilt: React.FC<BitsTiltProps> = ({ children, scale = 1.02, sx, ...props }) => {
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
    return Mod.Tilt || Mod.TiltCard || Mod.TiltedCard || Mod.CardTilt || null;
  }, [Mod]);

  if (Comp) {
    const propsMap: any = { scale };
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

export default BitsTilt;


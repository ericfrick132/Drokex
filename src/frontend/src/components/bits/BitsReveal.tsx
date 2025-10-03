import React, { useEffect, useMemo, useState } from 'react';
import { Box, BoxProps } from '@mui/material';

type Effect = 'fade' | 'up' | 'down' | 'left' | 'right' | 'scale' | 'blur';

interface BitsRevealProps extends BoxProps {
  effect?: Effect;
  delay?: number; // seconds
  duration?: number; // seconds
  once?: boolean;
}

/**
 * Thin runtime adapter to use react-bits reveal components when available.
 * If the package is not present or specific component not found, it renders children without animation.
 */
const BitsReveal: React.FC<BitsRevealProps> = ({
  children,
  effect = 'up',
  delay = 0,
  duration = 0.6,
  once = true,
  sx,
  ...props
}) => {
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
    // Try common reveal component names in popular bits libraries
    return (
      Mod.BlurFade ||
      Mod.FadeIn ||
      Mod.Reveal ||
      Mod.ScrollReveal ||
      Mod.RevealOnScroll ||
      null
    );
  }, [Mod]);

  const style: React.CSSProperties = useMemo(() => ({
    // best-effort: many libs read animationDelay/Duration via style
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }), [delay, duration]);

  if (Comp) {
    // Map effect to possible props
    const direction = effect === 'up' || effect === 'down' || effect === 'left' || effect === 'right' ? effect : undefined;
    const type = effect === 'blur' ? 'blur' : effect === 'scale' ? 'scale' : 'fade';
    const propsMap: any = {
      style,
      direction,
      effect: type,
      once,
    };
    return (
      <Comp {...propsMap}>
        <Box sx={sx} {...props}>
          {children}
        </Box>
      </Comp>
    );
  }

  // No animation fallback (still respects "only react-bits")
  return (
    <Box sx={sx} {...props}>
      {children}
    </Box>
  );
};

export default BitsReveal;


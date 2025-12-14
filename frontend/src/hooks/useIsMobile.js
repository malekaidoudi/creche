/**
 * useIsMobile - Hook pour détecter le viewport mobile
 * 
 * Retourne true si l'écran est < 1024px (breakpoint lg de Tailwind).
 * Utilise matchMedia pour une détection performante.
 * 
 * @usage
 * const isMobile = useIsMobile();
 * if (isMobile) {
 *   return <MobileView />;
 * }
 * return <DesktopView />;
 */

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 1024; // lg breakpoint Tailwind

const useIsMobile = (breakpoint = MOBILE_BREAKPOINT) => {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < breakpoint;
        }
        return false;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

        const handleChange = (e) => {
            setIsMobile(e.matches);
        };

        // Set initial value
        setIsMobile(mediaQuery.matches);

        // Listen for changes
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
        } else {
            // Fallback for older browsers
            mediaQuery.addListener(handleChange);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleChange);
            } else {
                mediaQuery.removeListener(handleChange);
            }
        };
    }, [breakpoint]);

    return isMobile;
};

export default useIsMobile;

// Export breakpoints for consistency
export const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
};

// Hook pour un breakpoint spécifique
export const useBreakpoint = (breakpoint) => {
    const bp = typeof breakpoint === 'string' ? BREAKPOINTS[breakpoint] : breakpoint;
    return useIsMobile(bp);
};

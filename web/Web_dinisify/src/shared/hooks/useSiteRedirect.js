import { useEffect } from 'react';
import { useMediaQuery } from './useMediaQuery';

const MOBILE_URL = import.meta.env.VITE_MOBILE_URL; // из .env
const DESKTOP_URL = import.meta.env.VITE_DESKTOP_URL;

export function useSiteRedirect() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const target = isMobile ? MOBILE_URL : DESKTOP_URL;
    if (target && window.location.href !== target) {
      window.location.replace(target);
    }
  }, [isMobile]);
}
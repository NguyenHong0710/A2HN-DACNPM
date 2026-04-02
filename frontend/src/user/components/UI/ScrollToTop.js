import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll window after a tiny delay to override browser's default scroll restoration
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      });
      // Fallback for some browsers/CSS setups
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 10);
  }, [pathname]);

  return null;
}

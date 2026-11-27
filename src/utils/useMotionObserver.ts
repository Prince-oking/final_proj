import { useEffect } from 'react';

/**
 * Lightweight IntersectionObserver + MutationObserver hook for `.reveal` elements
 * and smooth anchor link scrolling. Animates only transform & opacity,
 * respects `prefers-reduced-motion`, and leaves layout/design untouched.
 */
export function useMotionObserver(triggerKey: string) {
  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (reducedMotion) {
      root.classList.remove('motion-ready');
      document.querySelectorAll('.reveal').forEach((el) => {
        el.classList.add('is-visible');
      });
      return;
    }

    root.classList.add('motion-ready');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0.06,
        rootMargin: '0px 0px -24px 0px',
      },
    );

    const observeTargets = () => {
      document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
        observer.observe(el);
      });
    };

    observeTargets();

    // Automatically observe dynamically rendered `.reveal` blocks (e.g. search results)
    const mutationObserver = new MutationObserver(() => {
      observeTargets();
    });
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Smooth scroll handler for any same-page anchor links (`href="#..."`)
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#') return;

      const destination = document.querySelector(hash);
      if (destination) {
        event.preventDefault();
        destination.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    document.addEventListener('click', handleAnchorClick);

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      document.removeEventListener('click', handleAnchorClick);
    };
  }, [triggerKey]);
}

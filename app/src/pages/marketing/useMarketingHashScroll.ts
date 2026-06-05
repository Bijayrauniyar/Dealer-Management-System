import { useEffect, type MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { marketingHashScrollOffsetPx } from "@/pages/marketing/marketingUi";

/** Scroll to page top (hero). */
export function scrollMarketingToTop(behavior: ScrollBehavior = "smooth") {
  window.scrollTo({ top: 0, left: 0, behavior });
}

/** Logo / “home” — SPA keeps scroll position unless we reset it. */
export function useMarketingHomeNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (e: MouseEvent<HTMLAnchorElement>) => {
    const onLanding = location.pathname === "/";

    if (onLanding && !location.hash && !location.search) {
      e.preventDefault();
      scrollMarketingToTop();
      return;
    }

    if (onLanding) {
      e.preventDefault();
      navigate({ pathname: "/" });
      requestAnimationFrame(() => scrollMarketingToTop());
    }
    // From /faq etc.: default <Link> navigation; useMarketingHashScroll scrolls on paint.
  };
}

/** Scroll to a landing section id (sticky nav offset). */
export function scrollMarketingToId(id: string, behavior: ScrollBehavior = "smooth"): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - marketingHashScrollOffsetPx();
  window.scrollTo({ top: Math.max(0, top), behavior });
  return true;
}

/** Scroll from `#section` hash string. */
export function scrollMarketingToHash(hash: string, behavior: ScrollBehavior = "smooth"): boolean {
  const id = hash.replace(/^#/, "");
  return id ? scrollMarketingToId(id, behavior) : false;
}

/**
 * SPA landing: React Router does not scroll to #sections. Run after paint on `/` + hash.
 */
export function useMarketingHashScroll() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (pathname !== "/" || hash) return;
    scrollMarketingToTop("auto");
  }, [pathname, hash]);

  useEffect(() => {
    if (pathname !== "/" || !hash) return;

    const id = hash.replace(/^#/, "");
    if (!id) return;

    let cancelled = false;
    let attempts = 0;
    const run = () => {
      if (cancelled || attempts > 24) return;
      attempts += 1;
      if (!scrollMarketingToId(id)) {
        window.setTimeout(run, 50);
      }
    };

    const onHashChange = () => {
      const next = window.location.hash.replace(/^#/, "");
      if (next) scrollMarketingToId(next);
    };

    window.addEventListener("hashchange", onHashChange);
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [pathname, hash]);
}

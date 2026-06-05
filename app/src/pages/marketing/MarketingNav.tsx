import { useEffect, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { LANDING_NAV } from "@/pages/marketing/landingContent";
import { MarketingBrandLogo } from "@/pages/marketing/MarketingBrandLogo";
import { MarketingSessionControl } from "@/pages/marketing/MarketingSessionControl";
import { marketingContainer } from "@/pages/marketing/marketingUi";
import { scrollMarketingToHash } from "@/pages/marketing/useMarketingHashScroll";

/** In-app hash links on `/` — React Router won't scroll without an explicit navigate. */
function useLandingHashNav(onAfterNav?: () => void) {
  const location = useLocation();
  const navigate = useNavigate();

  return (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    const url = new URL(href, window.location.origin);
    if (url.pathname !== "/" || !url.hash) return;

    if (location.pathname === "/") {
      e.preventDefault();
      const keepLanding =
        location.search.includes("landing=1") && !url.search.includes("landing=1");
      navigate({
        pathname: "/",
        search: keepLanding ? "?landing=1" : url.search,
        hash: url.hash,
      });
      if (url.hash) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => scrollMarketingToHash(url.hash));
        });
      }
      onAfterNav?.();
    }
  };
}

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const onHashNav = useLandingHashNav(() => setOpen(false));

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className={`${marketingContainer} flex min-h-14 items-center justify-between gap-2 sm:min-h-12 sm:gap-3`}>
        <MarketingBrandLogo variant="nav" />

        <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main">
          {LANDING_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={onHashNav(item.href)}
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-700 lg:px-3 lg:text-[15px]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Link
            to="/?intent=demo#contact"
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-teal-800 transition-colors hover:bg-teal-50 lg:text-[15px]"
          >
            Book a demo
          </Link>
          <MarketingSessionControl variant="nav" />
        </div>

        <button
          type="button"
          className="md:hidden -mr-2 rounded-xl p-2.5 text-slate-700 transition-colors hover:bg-slate-100"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open ? (
        <div className="md:hidden max-h-[min(70dvh,calc(100dvh-3.5rem))] overflow-y-auto overscroll-contain border-t border-slate-200 bg-white shadow-lg">
          <nav className={`${marketingContainer} flex flex-col gap-1 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]`} aria-label="Mobile">
            {LANDING_NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-3.5 text-base font-medium text-slate-800 transition-colors hover:bg-slate-50 active:bg-slate-100"
                onClick={(e) => {
                  onHashNav(item.href)(e);
                  setOpen(false);
                }}
              >
                {item.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-4">
              <Link
                to="/?intent=demo#contact"
                className="flex min-h-11 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-base font-semibold text-teal-900"
                onClick={() => setOpen(false)}
              >
                Book a demo
              </Link>
              <div onClick={() => setOpen(false)} role="presentation">
                <MarketingSessionControl variant="navMobile" />
              </div>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

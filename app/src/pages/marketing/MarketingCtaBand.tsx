import { Link } from "react-router-dom";
import {
  marketingBtnGhostOnDark,
  marketingBtnOnDark,
  marketingContainer,
} from "@/pages/marketing/marketingUi";

export function MarketingCtaBand() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-700 to-teal-800 px-4 py-14 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.12) 0%, transparent 50%)",
        }}
      />
      <div className={`${marketingContainer} relative text-center`}>
        <h2 className="text-xl font-bold tracking-tight text-white min-[380px]:text-2xl sm:text-3xl lg:text-4xl">
          Start billing and stock in one place
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-teal-100 sm:text-lg">
          Try free for your first week, then subscribe to keep billing, stock, and credit in one place.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
          <Link to="/#pricing" className={marketingBtnOnDark}>
            See pricing
          </Link>
          <a href="#contact" className={marketingBtnGhostOnDark}>
            Contact us
          </a>
        </div>
      </div>
    </section>
  );
}

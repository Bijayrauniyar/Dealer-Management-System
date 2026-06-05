import type { ReactNode } from "react";
import {
  marketingContainer,
  marketingEyebrow,
  marketingH2,
  marketingLead,
  marketingScrollMt,
  marketingSectionY,
  marketingSectionYAnchor,
} from "@/pages/marketing/marketingUi";

type Props = {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  centered?: boolean;
  dark?: boolean;
  /** Tighter vertical padding (e.g. audience pills) */
  compact?: boolean;
};

export function LandingSection({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
  centered = false,
  dark = false,
  compact = false,
}: Props) {
  const pad = compact
    ? "py-10 sm:py-12"
    : id
      ? marketingSectionYAnchor
      : marketingSectionY;

  return (
    <section
      id={id}
      className={`${id ? marketingScrollMt : ""} ${pad} ${dark ? "bg-teal-900 text-white" : ""} ${className}`}
    >
      <div className={marketingContainer}>
        <header
          className={`max-w-3xl min-w-0 ${centered ? "mx-auto text-center" : ""} mb-6 sm:mb-8 lg:mb-10`}
        >
          {eyebrow ? (
            <p className={dark ? "text-xs font-semibold uppercase tracking-[0.12em] text-teal-200 sm:text-sm" : marketingEyebrow}>
              {eyebrow}
            </p>
          ) : null}
          <h2
            className={`${eyebrow ? "mt-2 sm:mt-3" : ""} ${marketingH2} ${dark ? "!text-white" : ""}`}
          >
            {title}
          </h2>
          {subtitle ? (
            <p className={`${marketingLead} ${dark ? "!text-teal-100/90" : ""}`}>{subtitle}</p>
          ) : null}
        </header>
        {children}
      </div>
    </section>
  );
}

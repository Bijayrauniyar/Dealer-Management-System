import type { ComponentProps } from "react";
import { Link } from "react-router-dom";
import { LAUNCH_TRIAL_CTA_HEADLINE } from "@/config/launchPricing";
import { PUBLIC_TRIAL_CTA_PATH } from "@/config/publicSignup";

type Props = Omit<ComponentProps<typeof Link>, "to" | "children"> & {
  children?: React.ReactNode;
};

/** Inline link to contact form with trial purpose pre-selected. */
export function TrialContactLink({
  children = LAUNCH_TRIAL_CTA_HEADLINE,
  className = "font-medium text-teal-700 hover:underline",
  ...rest
}: Props) {
  return (
    <Link to={PUBLIC_TRIAL_CTA_PATH} className={className} {...rest}>
      {children}
    </Link>
  );
}

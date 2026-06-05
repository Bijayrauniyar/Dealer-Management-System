import type { ComponentProps } from "react";
import { Link } from "react-router-dom";
import {
  PUBLIC_SIGNUP_CTA_LABEL,
  PUBLIC_SIGNUP_CTA_PATH,
  PUBLIC_TRIAL_CTA_LABEL,
  PUBLIC_TRIAL_CTA_LABEL_SHORT,
  PUBLIC_TRIAL_CTA_PATH,
} from "@/config/publicSignup";
import { cn } from "@/lib/utils";
import { marketingBtnPrimary } from "@/pages/marketing/marketingUi";

type Props = Omit<ComponentProps<typeof Link>, "to" | "children"> & {
  /** Trial headline + contact form purpose pre-selected. */
  trial?: boolean;
  /** Override button label (e.g. nav “Free trial”). */
  label?: string;
};

export function PublicSignupCta({ className, trial = false, label, ...rest }: Props) {
  const text = label ?? (trial ? PUBLIC_TRIAL_CTA_LABEL : PUBLIC_SIGNUP_CTA_LABEL);
  const shortTrial = trial && !label;
  return (
    <Link
      to={trial ? PUBLIC_TRIAL_CTA_PATH : PUBLIC_SIGNUP_CTA_PATH}
      className={cn(marketingBtnPrimary, className)}
      {...rest}
    >
      {shortTrial ? (
        <>
          <span className="sm:hidden">{PUBLIC_TRIAL_CTA_LABEL_SHORT}</span>
          <span className="hidden sm:inline">{text}</span>
        </>
      ) : (
        text
      )}
    </Link>
  );
}

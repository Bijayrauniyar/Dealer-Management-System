import { Navigate } from "react-router-dom";
import { PUBLIC_SIGNUP_ENABLED, PUBLIC_TRIAL_CTA_PATH } from "@/config/publicSignup";
import { RegisterPage } from "@/pages/RegisterPage";

/** Self-service register, or redirect to contact during pilot. */
export function RegisterGate() {
  if (PUBLIC_SIGNUP_ENABLED) return <RegisterPage />;
  return <Navigate to={PUBLIC_TRIAL_CTA_PATH} replace />;
}

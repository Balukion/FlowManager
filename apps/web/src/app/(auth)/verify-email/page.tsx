import { Suspense } from "react";
import { VerifyEmail } from "@web/components/features/auth/verify-email";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}

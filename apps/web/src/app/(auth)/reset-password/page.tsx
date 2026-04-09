import { Suspense } from "react";
import { ResetPasswordForm } from "@web/components/features/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Redefinir senha</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha uma nova senha para sua conta
        </p>
      </div>

      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}

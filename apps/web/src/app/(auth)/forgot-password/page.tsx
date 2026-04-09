import Link from "next/link";
import { ForgotPasswordForm } from "@web/components/features/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Esqueci minha senha</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Informe seu email para receber o link de redefinição
        </p>
      </div>

      <ForgotPasswordForm />

      <div className="mt-6 border-t pt-6 text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </div>
    </>
  );
}

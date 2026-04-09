import Link from "next/link";
import { LoginForm } from "@web/components/features/auth/login-form";

export default function LoginPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Entrar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bem-vindo de volta
        </p>
      </div>

      <LoginForm />

      <div className="mt-4 text-center text-sm text-muted-foreground">
        <Link
          href="/forgot-password"
          className="underline-offset-4 hover:underline hover:text-foreground"
        >
          Esqueceu a senha?
        </Link>
      </div>

      <div className="mt-6 border-t pt-6 text-center text-sm text-muted-foreground">
        Não tem uma conta?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Criar conta
        </Link>
      </div>
    </>
  );
}

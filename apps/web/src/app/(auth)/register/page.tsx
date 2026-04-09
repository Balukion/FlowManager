import Link from "next/link";
import { RegisterForm } from "@web/components/features/auth/register-form";

export default function RegisterPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Criar conta</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Comece a usar o FlowManager
        </p>
      </div>

      <RegisterForm />

      <div className="mt-6 border-t pt-6 text-center text-sm text-muted-foreground">
        Já tem uma conta?{" "}
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

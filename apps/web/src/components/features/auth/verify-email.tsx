"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@web/services/auth.service";
import { getErrorMessage } from "@shared/utils";

export function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    authService
      .verifyEmail(token)
      .then(() => {
        setStatus("success");
        setTimeout(() => router.push("/login"), 3000);
      })
      .catch((err: unknown) => {
        setStatus("error");
        setMessage(getErrorMessage(err));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">Verificando seu email...</p>;
  }

  if (status === "success") {
    return (
      <div className="space-y-1 text-center">
        <p className="font-medium text-green-600">Email confirmado com sucesso!</p>
        <p className="text-sm text-muted-foreground">Redirecionando para o login...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-destructive">{message}</p>
      <a href="/login" className="text-sm underline underline-offset-4">
        Voltar para o login
      </a>
    </div>
  );
}

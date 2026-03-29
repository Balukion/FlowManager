export function verifyEmailTemplate(data: {
  name: string;
  token: string;
  frontend_url: string;
}): string {
  const link = `${data.frontend_url}/verify-email?token=${data.token}`;
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Confirme seu email</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
  <h1 style="font-size:24px;margin-bottom:8px;">Confirme seu email</h1>
  <p style="color:#555;">Olá, <strong>${data.name}</strong>!</p>
  <p style="color:#555;">Clique no botão abaixo para confirmar seu endereço de email e ativar sua conta.</p>
  <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
    Confirmar email
  </a>
  <p style="color:#888;font-size:13px;">O link expira em 24 horas. Se você não criou uma conta, ignore este email.</p>
</body>
</html>`.trim();
}

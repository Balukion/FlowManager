export function resetPasswordTemplate(data: {
  name: string;
  token: string;
  frontend_url: string;
}): string {
  const link = `${data.frontend_url}/reset-password?token=${data.token}`;
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Redefinição de senha</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
  <h1 style="font-size:24px;margin-bottom:8px;">Redefinição de senha</h1>
  <p style="color:#555;">Olá, <strong>${data.name}</strong>!</p>
  <p style="color:#555;">Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para continuar.</p>
  <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
    Redefinir senha
  </a>
  <p style="color:#888;font-size:13px;">O link expira em 1 hora. Se você não solicitou a redefinição, ignore este email.</p>
</body>
</html>`.trim();
}

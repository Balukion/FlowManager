export function invitationTemplate(data: {
  workspace_name: string;
  inviter_name?: string;
  token: string;
  frontend_url: string;
}): string {
  const link = `${data.frontend_url}/invitations/accept?token=${data.token}`;
  const inviterPart = data.inviter_name
    ? `<strong>${data.inviter_name}</strong> convidou você para colaborar no workspace`
    : `Você foi convidado para colaborar no workspace`;
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Convite para workspace</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
  <h1 style="font-size:24px;margin-bottom:8px;">Você foi convidado!</h1>
  <p style="color:#555;">${inviterPart} <strong>${data.workspace_name}</strong>.</p>
  <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
    Aceitar convite
  </a>
  <p style="color:#888;font-size:13px;">O convite expira em 48 horas. Se você não esperava este convite, ignore este email.</p>
</body>
</html>`.trim();
}

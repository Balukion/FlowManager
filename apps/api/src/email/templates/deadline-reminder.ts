export function deadlineReminderTemplate(data: {
  user_name: string;
  entity_title: string;
  entity_type: "task" | "step";
  deadline: string;
  frontend_url: string;
  entity_url?: string;
}): string {
  const link = data.entity_url ?? data.frontend_url;
  const label = data.entity_type === "task" ? "tarefa" : "passo";
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Prazo se aproximando</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
  <h1 style="font-size:24px;margin-bottom:8px;">⏰ Prazo se aproximando</h1>
  <p style="color:#555;">Olá, <strong>${data.user_name}</strong>!</p>
  <p style="color:#555;">A ${label} <strong>"${data.entity_title}"</strong> tem prazo em <strong>${data.deadline}</strong>.</p>
  <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
    Ver ${label}
  </a>
</body>
</html>`.trim();
}

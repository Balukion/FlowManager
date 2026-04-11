export function taskStatusChangedTemplate(data: {
  user_name: string;
  task_title: string;
  from_status: string;
  to_status: string;
  workspace_name: string;
  task_url?: string;
}): string {
  const link = data.task_url ?? "#";
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Status da tarefa alterado</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
  <h1 style="font-size:24px;margin-bottom:8px;">Status atualizado</h1>
  <p style="color:#555;">Olá, <strong>${data.user_name}</strong>!</p>
  <p style="color:#555;">
    A tarefa <strong>"${data.task_title}"</strong> no workspace <strong>${data.workspace_name}</strong>
    teve seu status alterado de <strong>${data.from_status}</strong> para <strong>${data.to_status}</strong>.
  </p>
  ${data.task_url ? `
  <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
    Ver tarefa
  </a>` : ""}
</body>
</html>`.trim();
}

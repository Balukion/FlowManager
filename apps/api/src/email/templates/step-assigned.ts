export function stepAssignedTemplate(data: {
  assignee_name: string;
  step_title: string;
  task_title: string;
  workspace_name: string;
  frontend_url: string;
  task_url?: string;
}): string {
  const link = data.task_url ?? data.frontend_url;
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Você foi atribuído a um passo</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1a1a;">
  <h1 style="font-size:24px;margin-bottom:8px;">Nova atribuição</h1>
  <p style="color:#555;">Olá, <strong>${data.assignee_name}</strong>!</p>
  <p style="color:#555;">Você foi atribuído ao passo <strong>"${data.step_title}"</strong> na tarefa <strong>"${data.task_title}"</strong> do workspace <strong>${data.workspace_name}</strong>.</p>
  <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
    Ver tarefa
  </a>
</body>
</html>`.trim();
}

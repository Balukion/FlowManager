# CLAUDE.md — FlowManager

Leia este arquivo inteiro antes de qualquer ação.
Para o schema completo do banco, consulte `docs/database.md`.
Para as user stories, consulte `docs/stories.md`.

---

## O que é o projeto

FlowManager é um sistema de gerenciamento de tarefas colaborativo. Hierarquia: Workspace → Projeto → Tarefa → Passo. Usuários têm três papéis: super admin (dono do workspace), admin, e membro. Monorepo com frontend Next.js, backend Fastify, e pacotes compartilhados de tipos e utilitários.

---

## Stack e versões

| Camada        | Tecnologia                                    |
| ------------- | --------------------------------------------- |
| Linguagem     | TypeScript                                    |
| Frontend      | Next.js + TailwindCSS + shadcn/ui             |
| Backend       | Node.js + Fastify                             |
| Banco         | PostgreSQL + Prisma                           |
| Auth          | JWT (15min) + refresh token (7d)              |
| Monorepo      | Turborepo                                     |
| Estado global | Zustand                                       |
| Data fetching | TanStack Query                                |
| Testes        | Vitest + Testing Library                      |
| Storage       | AWS S3 (sa-east-1)                            |
| Email         | Resend                                        |
| Monitoramento | Sentry (backend)                              |
| Avatar        | DiceBear initials                             |
| Deploy        | Vercel (frontend) + Railway (backend + banco) |

---

## Comandos

```bash
# Desenvolvimento
turbo dev                    # sobe frontend e backend juntos
turbo dev --filter=api       # só o backend
turbo dev --filter=web       # só o frontend

# Testes
turbo test                   # roda todos os testes
turbo test --filter=api      # só backend
turbo test --filter=web      # só frontend
vitest --watch               # modo watch dentro de um app

# Build
turbo build                  # build completo

# Banco de dados
prisma migrate dev           # cria migration e aplica em dev
prisma migrate deploy        # aplica migrations em produção
prisma db seed               # popula com dados de exemplo
prisma studio                # interface visual do banco
prisma generate              # regenera o client após mudança no schema
```

---

## Estrutura de pastas

```
flowmanager/
├── apps/
│   ├── api/src/
│   │   ├── modules/          ← auth, users, workspaces, projects, tasks,
│   │   │                        steps, comments, labels, invitations,
│   │   │                        notifications, dashboard, activity-logs
│   │   ├── jobs/             ← cleanup, expire-invitations, deadline-reminders,
│   │   │                        retry-notifications
│   │   ├── plugins/          ← auth, rate-limit, swagger, cors, prisma
│   │   ├── middlewares/      ← authenticate, authorize, validate-workspace
│   │   ├── lib/              ← prisma.ts, resend.ts, s3.ts, jwt.ts
│   │   ├── email/templates/  ← invitation, verify-email, reset-password,
│   │   │                        step-assigned, deadline-reminder
│   │   ├── errors/           ← app-error, not-found, unauthorized,
│   │   │                        forbidden, conflict
│   │   ├── config/           ← env.ts, logger.ts
│   │   ├── server.ts
│   │   └── app.ts
│   ├── api/prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── api/tests/helpers/
│   │   ├── factories/
│   │   └── setup.ts
│   └── web/src/
│       ├── app/(auth)/       ← login, register, forgot-password, reset-password
│       ├── app/(app)/        ← dashboard, workspaces, settings
│       ├── components/ui/    ← shadcn/ui
│       ├── components/layout/← sidebar, header, nav-item, page-wrapper
│       ├── components/features/ ← auth, workspaces, projects, tasks, steps,
│       │                           comments, labels, dashboard, invitations
│       ├── components/error-boundary.tsx
│       ├── hooks/            ← use-auth, use-workspace, use-tasks,
│       │                        use-pagination, use-debounce
│       ├── services/         ← api.client, auth, workspace, project,
│       │                        task, step, comment, dashboard
│       ├── stores/           ← auth.store, workspace.store
│       └── lib/              ← utils.ts, query-client.ts
├── packages/
│   ├── types/src/
│   │   ├── entities/         ← um arquivo por entidade
│   │   ├── enums/            ← role, status, priority, notification
│   │   └── api/              ← requests/ e responses/ por módulo
│   └── shared/src/
│       ├── constants/        ← limits.ts, pagination.ts, regex.ts
│       └── utils/            ← date.ts, slug.ts, pagination.ts, string.ts
├── docs/
│   ├── database.md           ← schema completo com todas as tabelas
│   └── stories.md            ← 111 user stories
```

---

## Aliases de import

```
@api/*     → apps/api/src/*
@web/*     → apps/web/src/*
@types/*   → packages/types/src/*
@shared/*  → packages/shared/src/*
```

---

## Regras obrigatórias de implementação

### TDD — sem exceção

- Escreva o teste antes do código. Sempre.
- Ciclo: Red (teste falha) → Green (código mínimo passa) → Refactor
- Feature só está pronta quando unitário + integração passam e CI está verde
- Se eu pedir uma feature sem pedir o teste, escreva o teste antes

### Testes junto ao código

- `task.service.spec.ts` fica ao lado de `task.service.ts`
- E2E fica em `tests/e2e/` — não implementar ainda

### Arquivos com no máximo 500 linhas

- Se um arquivo se aproximar de 500 linhas, extraia responsabilidades

### Separação de camadas — backend

- **Controller:** recebe requisição, valida input via schema, chama service, retorna resposta. Sem lógica de negócio.
- **Service:** toda lógica de negócio. Sem acesso direto ao banco, sem conhecimento de HTTP.
- **Repository:** acesso ao banco via Prisma. Sem lógica de negócio.
- **Schema:** define formato de entrada e saída. Usado pelo Fastify para validação automática.

### Nomenclatura

- Arquivos: `kebab-case` — `task-service.ts`
- Classes e tipos: `PascalCase` — `TaskService`
- Funções e variáveis: `camelCase` — `createTask`
- Constantes: `UPPER_SNAKE_CASE` — `MAX_TITLE_LENGTH`
- Tabelas do banco: `snake_case` — `task_labels`

### Barrel files — só no nível de módulo

```typescript
// modules/tasks/index.ts — correto
export { TaskController } from "./tasks.controller";
export { TaskService } from "./tasks.service";
// Nunca dentro das camadas individuais
```

---

## Padrões do projeto

### Soft delete

- Todas as tabelas principais têm `deleted_at`
- Toda query filtra `WHERE deleted_at IS NULL`
- Deleção permanente após 30 dias via job
- Exceção: `activity_logs` — registro imutável, sem soft delete

### Paginação cursor-based

```typescript
// Formato: GET /tasks?cursor=uuid&limit=20
const safeLimit = Math.min(limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
// Constantes em packages/shared/constants/pagination.ts
```

### Tokens sempre como hash

- Refresh tokens, convites, verificação de email, recuperação de senha
- Nunca guardar o valor real no banco

### Senhas com bcrypt

```typescript
const hash = await bcrypt.hash(password, 10);
const valid = await bcrypt.compare(password, hash);
```

### Email sempre normalizado

```typescript
// Sempre antes de salvar ou comparar
const normalizedEmail = email.toLowerCase().trim();
```

### Slugs — padrão único em packages/shared/utils/slug.ts

```typescript
generateSlug("Minha Startup"); // → 'minha-startup'
generateSlug("App v2.0!"); // → 'app-v2-0'
// Se slug já existe: 'minha-startup-2', 'minha-startup-3'
```

### Resposta padrão da API

```typescript
// Sucesso
{ "data": {}, "meta": {} }
// Erro
{ "error": { "code": "TASK_NOT_FOUND", "message": "Tarefa não encontrada" } }
// Sucesso com alerta
{ "data": {}, "warnings": ["STEPS_DEADLINE_EXCEEDED"] }
```

### Logging — Pino via Fastify

```typescript
// Nunca logar dados sensíveis
logger.info({ userId, workspaceId }, "workspace created"); // correto
logger.info({ password, token }, "user login"); // NUNCA

// Níveis
// debug  → desenvolvimento
// info   → ações importantes do sistema
// warn   → situações inesperadas mas não críticas
// error  → falhas que precisam de atenção
```

### Verificação de permissões — padrão

```typescript
// Super admin = dono do workspace
const isSuperAdmin = workspace.owner_id === userId;

// Admin = role ADMIN em workspace_members
const member = await memberRepository.find(workspaceId, userId);
const isAdmin = member?.role === "ADMIN";

// Membro = existe em workspace_members
const isMember = !!member;
```

### Autenticação nos endpoints

```typescript
// Middleware authenticate injeta userId no request
request.userId; // disponível em todo endpoint autenticado

// Middleware validate-workspace injeta workspace e member
request.workspace; // workspace atual
request.member; // membro atual com role
```

### Avatar padrão

```
https://api.dicebear.com/7.x/initials/svg?seed={name}
```

Usado quando `avatar_url` ou `logo_url` for nulo.
Componente `Avatar` no frontend sempre implementa fallback CSS.

### Upload de imagens — presigned URL

```
1. Frontend chama POST /uploads/presign com tipo e tamanho
2. Backend valida limites (avatar: 2MB, logo: 5MB — JPEG/PNG/WebP)
3. Backend gera presigned URL com validade de 5 minutos
4. Frontend faz upload direto para o S3
5. Frontend chama PATCH /users/me com a URL final
6. Backend salva no banco
```

### Status da tarefa — automático vs manual

```typescript
if (!task.status_is_manual) {
  const allDone = steps.every((s) => s.status === "DONE");
  task.status = allDone ? "DONE" : "IN_PROGRESS";
}
// Se status_is_manual = true, nunca alterar automaticamente
```

### Prazo de passos

```typescript
// Bloquear criação/edição com prazo posterior à tarefa
if (task.deadline && step.deadline > task.deadline) {
  throw new ConflictError("STEP_DEADLINE_EXCEEDS_TASK");
}
// Ao encurtar prazo da tarefa — alertar, não bloquear
if (affectedSteps.length > 0) {
  return { data: updatedTask, warnings: ["STEPS_DEADLINE_EXCEEDED"] };
}
```

### Number de tarefas — sequencial por projeto

```typescript
// Ao criar uma tarefa, buscar o maior number do projeto e incrementar
const last = await taskRepository.findLastNumber(projectId);
const number = (last?.number ?? 0) + 1;
```

### Cascade delete

```
workspace deletado:
  workspace_members, invitations → delete imediato
  projects, tasks, steps, comments → soft delete em cascata
  step_assignments, task_watchers, task_labels, comment_mentions → delete imediato
  activity_logs, notifications → manter

membro removido:
  step_assignments → preencher unassigned_at e unassigned_by
  task_watchers → delete imediato
```

### Order de passos e tarefas — reajuste após deleção

```typescript
const remaining = await repository.findByTask(taskId);
await Promise.all(
  remaining.map((item, index) =>
    repository.update(item.id, { order: index + 1 }),
  ),
);
```

### Tratamento de erros no frontend

```typescript
// Padrão para mutations com TanStack Query
onError: (error) => {
  toast.error(error.message ?? "Algo deu errado");
};
```

### Factories de teste — padrão

```typescript
// tests/helpers/factories/task.factory.ts
export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: randomUUID(),
    title: "Tarefa de teste",
    status: "TODO",
    priority: "LOW",
    ...overrides,
  };
}
```

---

## Enums

```typescript
Role: ADMIN | MEMBER;
InvitationStatus: PENDING | VIEWED | ACCEPTED | EXPIRED | DECLINED;
ProjectStatus: ACTIVE | ARCHIVED;
TaskStatus: TODO | IN_PROGRESS | DONE;
StepStatus: PENDING | IN_PROGRESS | DONE;
Priority: LOW | MEDIUM | HIGH;
NotificationType: STEP_ASSIGNED |
  DEADLINE_APPROACHING |
  TASK_STATUS_CHANGED |
  WORKSPACE_INVITATION |
  COMMENT_MENTION;
```

---

## Metadata de activity_logs

```typescript
TASK_STATUS_CHANGED:   { from: 'TODO', to: 'DONE', is_manual: true }
TASK_PRIORITY_CHANGED: { from: 'LOW', to: 'HIGH' }
STEP_ASSIGNED:         { assigned_to: ['user-id-1', 'user-id-2'] }
STEP_UNASSIGNED:       { unassigned_from: 'user-id', reason: 'member_removed' }
MEMBER_ROLE_CHANGED:   { from: 'MEMBER', to: 'ADMIN' }
COMMENT_EDITED:        { previous_content: 'texto anterior' }
```

---

## Jobs agendados

| Job                 | Cron        | O que faz                                                    |
| ------------------- | ----------- | ------------------------------------------------------------ |
| Cleanup             | `0 2 * * *` | Deleta workspaces (30d), notifications (90d), revoked tokens |
| Expire invitations  | `0 2 * * *` | Atualiza convites vencidos para EXPIRED                      |
| Deadline reminders  | `0 8 * * *` | Verifica prazos próximos e cria notificações                 |
| Retry notifications | `0 * * * *` | Reenvia com sent_at = null — máximo 3 tentativas             |

---

## Rate limiting

| Endpoint                         | Limite                  |
| -------------------------------- | ----------------------- |
| POST /auth/login                 | 5 por IP por minuto     |
| POST /auth/forgot-password       | 3 por email por hora    |
| POST /workspaces/:id/invitations | 10 por usuário por hora |

---

## Healthcheck

```
GET /health → { "status": "ok", "timestamp": "2026-03-27T10:00:00Z" }
```

Usado pelo Railway para verificar se o deploy funcionou.

---

## Ordem de inicialização do backend

```
1. Validar variáveis de ambiente — não subir se faltar obrigatória
2. Conectar ao banco (Prisma)
3. Inicializar Sentry
4. Registrar plugins (cors, rate-limit, swagger)
5. Registrar rotas
6. Inicializar jobs
7. Subir o servidor
```

---

## Comportamento de falha dos serviços externos

| Serviço    | Comportamento                                             |
| ---------- | --------------------------------------------------------- |
| PostgreSQL | Erro 503, healthcheck degraded, sem fallback              |
| Resend     | Retry automático, máximo 3 tentativas, falha silenciosa   |
| AWS S3     | Falha visível para o usuário, sistema continua sem imagem |
| Sentry     | Falha silenciosa, sistema continua normalmente            |
| DiceBear   | Fallback CSS com iniciais do nome                         |

---

## Variáveis de ambiente obrigatórias

```bash
# Aplicação
NODE_ENV, API_PORT, API_URL, NEXT_PUBLIC_API_URL, FRONTEND_URL

# Banco
DATABASE_URL, DATABASE_TEST_URL

# JWT
JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN, TOKEN_SECRET

# Tokens
INVITATION_TOKEN_EXPIRES_HOURS, EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS
PASSWORD_RESET_TOKEN_EXPIRES_HOURS

# Segurança
MAX_LOGIN_ATTEMPTS, ACCOUNT_LOCK_DURATION_MINUTES, ALLOWED_ORIGINS

# AWS S3
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
AWS_S3_BUCKET_NAME, S3_MAX_AVATAR_SIZE_MB, S3_MAX_LOGO_SIZE_MB

# Resend
RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME

# Sentry
SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN

# Paginação
DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE

# Jobs
CRON_CLEANUP, CRON_DEADLINE_REMINDERS, CRON_RETRY_NOTIFICATIONS
```

---

## Checklist pós-implementação

- [ ] Teste unitário escrito e passando
- [ ] Teste de integração escrito e passando
- [ ] Todos os testes anteriores continuam passando
- [ ] CI verde
- [ ] Nova variável de ambiente documentada no .env.example
- [ ] Nova tabela ou coluna tem migration gerada
- [ ] Novo problema descoberto documentado em Armadilhas abaixo

---

## Armadilhas conhecidas

> Cresce com o projeto. Sempre que resolver um problema difícil, documente aqui.
> Formato: sintoma → causa → solução.

_Vazia no início — adicione sempre que resolver um problema não óbvio._

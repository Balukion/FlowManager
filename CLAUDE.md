# AGENTS.md — FlowManager

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
│       ├── app/(app)/       ← dashboard, workspaces, settings
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
│   ├── stories.md            ← 111 user stories
│   └── swagger.md            ← convenções de documentação da API
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

### Idioma obrigatório do projeto

- Todo conteúdo do projeto deve ser escrito em inglês
- Isso inclui código visível ao usuário, documentação, README, Swagger/OpenAPI, comentários, nomes de seeds de demonstração, mensagens de erro, textos de interface e descrições de PR quando forem adicionadas ao repositório
- Se existir qualquer conteúdo em português, ele deve ser traduzido para inglês ao tocar no arquivo
- Não misturar português e inglês no mesmo artefato
- Exceção: este arquivo de instruções e seu espelho podem permanecer em português se essa for a convenção de manutenção interna

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
generateSlug("App v2.0!"); // → 'app-v20'
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

### Padrão de documentação Swagger/OpenAPI

- Toda rota nova deve registrar `schema` no `app.METHOD(...)`
- Documentar `params`, `query`, `body` e `response` sempre que aplicável
- `204 No Content` nunca deve declarar body de resposta
- Responses devem refletir o payload real do controller, sem inventar campos
- Padrões oficiais:
  - sucesso simples → `{ data: ... }`
  - sucesso sem payload relevante → `{ data: {} }`
  - sucesso com alerta → `{ data: ..., warnings: string[] }`
  - listagem paginada → `{ data: ..., meta: { next_cursor } }`
- Reutilizar helpers compartilhados de documentação quando existir, em vez de duplicar schema
- Convenção detalhada e exemplos ficam em `docs/swagger.md`

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

## Pendências futuras

### Quando for implementar os jobs agendados
Criar um `JobRunner` simples com interface uniforme antes de implementar os 4 jobs (cleanup, expire-invitations, deadline-reminders, retry-notifications). Cada job deve implementar a mesma interface `{ name, cron, run() }` para facilitar testes e registro centralizado. Sem essa abstração, os jobs viram scripts soltos difíceis de testar isoladamente.

### Testes de activity log como efeito colateral
Hoje os testes de activity-logs só verificam o GET com logs criados diretamente no banco. Quando os services estiverem implementados, adicionar testes nos módulos correspondentes que verificam que a ação X realmente cria o log Y. Exemplo em tasks.controller.spec.ts:
```typescript
// Altera status via API → verifica que log foi criado
await app.inject({ method: "PATCH", url: `.../status`, body: { status: "DONE" } })
const log = await prisma.activityLog.findFirst({ where: { task_id, action: "TASK_STATUS_CHANGED" } })
expect(log?.metadata).toEqual({ from: "TODO", to: "DONE" })
```
Fazer isso para: TASK_STATUS_CHANGED, TASK_PRIORITY_CHANGED, STEP_ASSIGNED, STEP_UNASSIGNED, MEMBER_ROLE_CHANGED, COMMENT_EDITED.

### Bugs e lacunas conhecidas (a corrigir)

**1. Menções exibem UUID em vez do nome**
Sintoma: comentários com `@{uuid}` aparecem com o UUID bruto no texto.
Causa: `MentionTextarea` converte nome → UUID ao salvar, mas não há função de render inverso.
Solução: criar `renderMentions(content, members)` que substitui `@{uuid}` por `@nome` antes de exibir.

**2. Step IN_PROGRESS sem UI (Story 52)**
Sintoma: não há como marcar um passo como "Em andamento" — checkbox só alterna PENDING ↔ DONE.
Solução: trocar o checkbox por um select de 3 estados (Pendente / Em andamento / Concluído) em `StepList`.

**3. Notificações in-app ausentes**
Sintoma: notificações são criadas no banco mas nunca exibidas na UI — só emails.
Solução: adicionar sino no header com dropdown listando as notificações do usuário (endpoint `GET /notifications`).

**4. Carga de trabalho (Story 95) ignora passos**
Sintoma: `getMemberWorkload` conta só `assignee_id` de tarefas; passos atribuídos não entram no cálculo.
Solução: incluir `stepAssignment` no `groupBy` e somar `open_tasks + open_steps`.

**5. Paginação de comentários mistura pais e filhos**
Sintoma: cursor-based pagination aplica `limit` ao conjunto total (pais + filhos), podendo fatiar threads no meio.
Solução: paginar apenas comentários raiz (`parent_id IS NULL`) e incluir as respostas de cada um no payload (`replies: Comment[]`).

### Próxima fase — Refactoring, Performance e Jobs Assíncronos
Ver discussão detalhada de como executar no log de decisões.

---

## Checklist pós-implementação

- [ ] Teste unitário escrito e passando
- [ ] Teste de integração escrito e passando
- [ ] Todos os testes anteriores continuam passando
- [ ] CI verde
- [ ] Nova variável de ambiente documentada no .env.example
- [ ] Nova tabela ou coluna tem migration gerada
- [ ] Novo problema descoberto documentado em Armadilhas abaixo
- [ ] Swagger atualizado — schemas de request e response preenchidos para todos os endpoints novos

---

## Armadilhas conhecidas

> Cresce com o projeto. Sempre que resolver um problema difícil, documente aqui.
> Formato: sintoma → causa → solução.

### migrate deploy não aceita --url no Windows
Sintoma: `unknown or unexpected option: --url` ao rodar `prisma migrate deploy --url=...`.
Causa: O Prisma CLI não suporta o flag `--url` no comando `migrate deploy`. No Windows, variáveis inline (`VAR=valor comando`) também não funcionam no cmd/PowerShell.
Solução: No Git Bash, setar a variável antes do comando funciona:
`DATABASE_URL="postgresql://..." npx prisma migrate deploy`
Para o banco de testes, rodar esse comando manualmente sempre que criar uma nova migration.

### setErrorHandler do Fastify deve ser registrado antes das rotas
Sintoma: erros lançados nos handlers retornam o formato padrão do Fastify `{ statusCode, error: "Bad Request", message }` em vez do formato customizado `{ error: { code, message } }`. O handler customizado nunca é chamado.
Causa: o Fastify herda o error handler do scope pai para os scopes filhos no momento em que os plugins/rotas são registrados. Registrar o handler depois dos `app.register(...)` não retroage aos scopes já criados.
Solução: sempre chamar `app.setErrorHandler(...)` **antes** de qualquer `app.register(plugin/rotas)` em `app.ts`.

### instanceof falha em fronteiras de módulos ESM no Vitest
Sintoma: `error instanceof AppError` retorna `false` dentro do `setErrorHandler`, mesmo o erro sendo claramente uma subclasse de `AppError`. O handler customizado não captura os erros da aplicação.
Causa: o sistema de mocks do Vitest (`vi.mock(...)`) pode gerar identidades de módulo distintas, fazendo a classe `AppError` importada em `app.ts` ser um objeto diferente da usada no service.
Solução: usar duck-typing no lugar de `instanceof` — `typeof error.statusCode === "number" && typeof error.code === "string"` — para identificar erros da aplicação no error handler.

### @fastify/rate-limit: req.body é undefined no keyGenerator por padrão
Sintoma: keyGenerator configurado como `(req) => req.body?.email ?? req.ip` sempre retorna o IP — todos os requests compartilham o mesmo contador, independente do email.
Causa: por padrão, `@fastify/rate-limit` adiciona o hook no estágio `onRequest`, que roda antes do body parsing. `req.body` ainda é `undefined` nesse momento.
Solução: passar `hook: "preHandler"` na config da rota para que o keyGenerator rode depois do body parsing:
```typescript
config: { rateLimit: { hook: "preHandler", keyGenerator: (req) => req.body?.email ?? req.ip } }
```

### Testes de integração com banco compartilhado colidem quando rodam em paralelo
Sintoma: `Unique constraint failed` em testes que criam registros com o mesmo email/dado, mesmo com `afterEach` limpando o banco entre testes.
Causa: Vitest com `pool: "forks"` roda arquivos de teste em paralelo por padrão. Dois arquivos criando o mesmo registro simultaneamente no banco de testes colidem antes do cleanup rodar.
Solução: adicionar `fileParallelism: false` no `vitest.config.ts` para garantir que os arquivos rodem em série.

### `mutateAsync` re-lança o erro mesmo quando `onError` está definido
Sintoma: mutation com `onError` configurado ainda exibe o overlay de crash do Next.js com `Runtime ApiError`. O feedback da mutation chega a aparecer, mas o app quebra.
Causa: `mutateAsync` retorna uma Promise que rejeita quando a mutation falha — independente do `onError`. Usar `try/finally` sem `catch` no `handleSubmit` deixa o erro escapar como unhandled rejection.
Solução: todo `handleSubmit` de formulário deve usar `try/catch/finally`. O `catch` captura o erro e exibe via `setError` ou `setSubmitError`. Nunca usar `try/finally` sozinho quando o `onSubmit` pode rejeitar.
```typescript
try {
  await onSubmit(data);
} catch (err) {
  setSubmitError(err instanceof Error ? err.message : "Algo deu errado");
} finally {
  setLoading(false);
}
```

### `response.json()` lança SyntaxError em respostas 204 No Content
Sintoma: DELETE que retorna 204 causa erro no frontend (`Unexpected end of JSON input`). A mutation vai para `onError`, o item não some da UI, mas no banco já foi deletado. Na tentativa seguinte, o backend retorna 404.
Causa: `api.client.ts` chamava `response.json()` incondicionalmente. Respostas 204 não têm body — `json()` lança `SyntaxError`.
Solução: verificar `response.status === 204` antes de chamar `json()` e retornar `undefined` diretamente:
```typescript
if (response.status === 204) return undefined as T;
const body = await response.json();
```

### Specs de formulário sem caso de erro dão falsa segurança
Sintoma: todos os testes passam, mas erros de API (rate limit, conflito, 5xx) crasham o app em produção.
Causa: specs escritos apenas para o caminho feliz (`mockResolvedValue`) e validação client-side. O caso `mockRejectedValue` nunca foi testado.
Solução: todo spec de formulário deve incluir um teste "shows error message when onSubmit throws":
```typescript
it("shows error message when onSubmit throws", async () => {
  mockOnSubmit.mockRejectedValue(new Error("Rate limit exceeded"));
  // preenche e submete o form
  await waitFor(() => {
    expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
  });
});
```

### Toda mutation que gera dado visível deve invalidar todos os queries afetados
Sintoma: após executar uma ação (atribuir passo, criar comentário, alterar status, etc.), a UI não reflete a mudança — só aparece ao recarregar a página.
Causa: TanStack Query mantém o cache antigo. O Next.js App Router não desmonta o layout ao navegar entre páginas filhas, então nunca dispara um fresh mount. Se a mutation não invalida explicitamente todos os query keys afetados, os dados ficam desatualizados.
Solução: cada `mutation.onSuccess` deve chamar `queryClient.invalidateQueries({ queryKey: [...] })` para **todos** os queries que exibem dados alterados pela mutation. Isso inclui queries secundárias como o histórico de atividades `["activity", taskId]`.
Regra: ao adicionar ou remover uma mutation, responda "quais queries mostram dados que essa mutation altera?" e invalide todos eles. Exemplo:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["steps", taskId] });     // lista de passos
  queryClient.invalidateQueries({ queryKey: ["task", taskId] });      // status recalculado
  queryClient.invalidateQueries({ queryKey: ["activity", taskId] });  // histórico da tarefa
},
```
Queries que tipicamente precisam ser invalidados junto:
- `["steps", taskId]` → qualquer mutation em passos ou atribuições
- `["task", taskId]` → mutations que afetam status ou dados da tarefa
- `["activity", taskId]` → qualquer mutation que gera um activity log na tarefa
- `["tasks", workspaceId, projectId]` → mutations que afetam a lista de tarefas

### countByProject/countByTask sem workspaceId permite reorder cross-workspace
Sintoma: admin do workspace A consegue reordenar tarefas/passos do workspace B enviando IDs externos numa URL válida do workspace A.
Causa: `countByProject(projectId, ids)` e `countByTask(taskId, ids)` só checavam se os IDs pertencem ao projeto/tarefa, mas não verificavam se o projeto/tarefa pertence ao workspace da requisição. Como Task não tem `workspace_id` direto, a checagem cruzada passava sem validar o escopo do workspace.
Solução: adicionar `workspaceId` às assinaturas de `countByProject` e `countByTask` com filtro via relação aninhada do Prisma: `project: { workspace_id: workspaceId }` em tasks, e `task: { project: { workspace_id: workspaceId } }` em steps.

### updateAvatar/updateLogo aceitam qualquer URL sem validar origem S3
Sintoma: PATCH /users/me/avatar e PATCH /workspaces/:id/logo aceitam `https://evil.com/rastreador.gif` sem erro, salvando a URL no banco e servindo-a para outros usuários.
Causa: os endpoints faziam validação de formato URI (via JSON Schema), mas não verificavam se a URL é do bucket S3 do projeto.
Solução: no service, antes de salvar, validar que a URL começa com `https://${env.AWS_S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/`. Lançar `BadRequestError("URL inválida", "INVALID_AVATAR_URL")` ou `"INVALID_LOGO_URL"` em caso negativo. Atualizar os testes existentes para usar URLs no formato correto do bucket.

### vi.stubEnv em beforeAll para testar rate limit com app separado
Sintoma: não há como testar rate limiting em integração porque `vitest.config.ts` seta `DISABLE_RATE_LIMIT: "true"` globalmente.
Causa: a env é lida no momento do registro das rotas (`buildApp()`), então após stubar, a segunda instância do app usa o valor novo.
Solução: criar um `describe` separado com `beforeAll` que chama `vi.stubEnv("DISABLE_RATE_LIMIT", "")` e `vi.stubEnv("INVITE_PREVIEW_RATE_LIMIT_MAX", "2")` antes de `buildApp()`, e `vi.unstubAllEnvs()` no `afterAll`. Funciona porque `process.env` é lido no momento do registro da rota, não no import do módulo. A rota que suporta esse padrão precisa ler o max via `Number(process.env["INVITE_PREVIEW_RATE_LIMIT_MAX"] ?? "30")` dentro do corpo da função de routes (não no nível de módulo).

### Rodar arquivo de integração isolado após a suite completa gera falsos negativos
Sintoma: um teste de integração falha ao rodar em isolamento (`vitest run caminho/do/arquivo.spec.ts`), mas passa normalmente quando a suite completa roda com `turbo test`. O erro típico é algo como `Cannot destructure property 'access_token' of '...data' as it is undefined`, indicando que o endpoint retornou erro em vez de sucesso.
Causa: `git stash` não guarda arquivos untracked. Mais importante: a suite completa deixa estado no banco de testes (registros criados nos testes de integração). Rodar um arquivo isolado depois encontra dados já existentes (ex: email duplicado), causando erros de constraint. O teste falha por estado sujo — não por bug no código.
Solução: para verificar se uma falha é pré-existente, sempre rodar a suite completa do zero com `turbo test`, nunca isolar o arquivo suspeito depois de já ter rodado tudo. Se precisar rodar um arquivo de integração em isolamento, resetar o banco de testes antes.

### Conteúdo em português escapa fácil em documentação e UI
Sintoma: README, Swagger summaries, mensagens de erro, placeholders, labels de interface ou docs acabam com trechos em português mesmo com a base principal em inglês.
Causa: o projeto foi iniciado com parte da documentação interna em português e isso facilita copiar texto antigo ou reaproveitar strings sem revisão final de idioma.
Solução: tratar inglês como padrão obrigatório do produto. Sempre que tocar em um arquivo com texto visível, revisar se há qualquer trecho em português e traduzir para inglês antes de concluir a tarefa. Não deixar artefatos híbridos.

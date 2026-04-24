# Swagger/OpenAPI — Convenções do FlowManager

Este arquivo define o padrão de documentação da API no Swagger para manter consistência entre módulos e evitar drift entre controller e schema.

## Regra geral

- Toda rota nova deve registrar `schema` no `app.METHOD(...)`
- Documentar `params`, `query`, `body` e `response` sempre que aplicável
- O schema deve refletir o payload real retornado pelo controller
- Preferir helpers compartilhados em `apps/api/src/lib/api-docs.ts`
- `204 No Content` não deve declarar body de resposta

## Helpers compartilhados

Helpers mínimos disponíveis em `apps/api/src/lib/api-docs.ts`:

- `strictObjectSchema(...)` para criar objetos com `additionalProperties: false`
- `paramsSchema(...)` para `params`
- `querySchema(...)` para `querystring`
- `bodySchema(...)` para `body`

Escopo intencionalmente limitado:

- usar para `params`, `query` e `body`
- não usar para abstrair `response` complexo nesta fase
- preferir clareza e baixo risco a helpers genéricos demais

## Envelope padrão de sucesso

### Sucesso simples

```json
{
  "data": {}
}
```

Usar quando o controller retorna `reply.status(...).send({ data: result })`.

### Sucesso sem payload relevante

```json
{
  "data": {}
}
```

Usar em actions como assign, mark-as-read, watch e similares quando o payload útil é vazio.

### Sucesso com warnings

```json
{
  "data": {},
  "warnings": ["STEPS_DEADLINE_EXCEEDED"]
}
```

Usar somente quando o controller realmente retorna warnings.

### Paginação cursor-based

```json
{
  "data": [],
  "meta": {
    "next_cursor": "uuid-ou-null"
  }
}
```

Usar em endpoints paginados.

### No Content

Status `204` sem body.

## Envelope padrão de erro

```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Tarefa não encontrada"
  }
}
```

Não é necessário inventar formatos alternativos por rota.

## Checklist rápida para rotas novas

1. O `schema` está registrado na rota?
2. `params` foram documentados?
3. `query` foi documentada quando existe filtro/paginação?
4. `body` foi documentado quando existe input?
5. `response` bate com o controller real?
6. Se for `204`, a rota ficou sem body?

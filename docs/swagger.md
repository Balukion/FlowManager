# Swagger/OpenAPI - FlowManager Conventions

This document defines the API documentation standard used in FlowManager to keep Swagger consistent across modules and reduce drift between controllers and schemas.

## General rule

- Every new route must register a `schema` in `app.METHOD(...)`
- Document `params`, `query`, `body`, and `response` whenever applicable
- The schema must reflect the real payload returned by the controller
- Prefer shared helpers from `apps/api/src/lib/api-docs.ts`
- `204 No Content` must not declare a response body

## Shared helpers

Minimal helpers available in `apps/api/src/lib/api-docs.ts`:

- `strictObjectSchema(...)` to create objects with `additionalProperties: false`
- `paramsSchema(...)` for `params`
- `querySchema(...)` for `querystring`
- `bodySchema(...)` for `body`

Intentional scope:

- use them for `params`, `query`, and `body`
- do not use them to over-abstract complex `response` schemas at this stage
- prefer clarity and low risk over overly generic helpers

## Standard success envelope

### Simple success

```json
{
  "data": {}
}
```

Use this when the controller returns `reply.status(...).send({ data: result })`.

### Success without meaningful payload

```json
{
  "data": {}
}
```

Use this in actions such as assign, mark-as-read, watch, and similar operations where the useful payload is empty.

### Success with warnings

```json
{
  "data": {},
  "warnings": ["STEPS_DEADLINE_EXCEEDED"]
}
```

Use this only when the controller actually returns warnings.

### Cursor-based pagination

```json
{
  "data": [],
  "meta": {
    "next_cursor": "uuid-or-null"
  }
}
```

Use this in paginated endpoints.

### No Content

Status `204` with no response body.

## Standard error envelope

```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task not found"
  }
}
```

There is no need to invent alternative error formats per route.

## Quick checklist for new routes

1. Is the `schema` registered on the route?
2. Were `params` documented?
3. Was `query` documented when filters or pagination exist?
4. Was `body` documented when input exists?
5. Does `response` match the real controller output?
6. If the route returns `204`, was the response body omitted?

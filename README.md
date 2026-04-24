# FlowManager

FlowManager is a full-stack collaborative task management platform built to explore disciplined AI-assisted software development through strict planning, test-driven development, and explicit architectural decisions.

It was designed around a clear hierarchy of `Workspace -> Project -> Task -> Step`, with role-based permissions, activity history, operational rules, and documented APIs. The project is not a commercial product attempt. It is a deliberate learning project created to practice building reliable software with modern AI tools without giving up engineering rigor.

## Quick links

- Web app: `http://localhost:3000`
- API: `http://localhost:3001`
- Swagger UI: [http://localhost:3001/docs](http://localhost:3001/docs)
- User stories: [docs/stories.md](./docs/stories.md)
- Database reference: [docs/database.md](./docs/database.md)
- Swagger conventions: [docs/swagger.md](./docs/swagger.md)

## What FlowManager is

FlowManager is a collaboration system for individuals or teams who need to organize work across multiple projects while keeping ownership, task breakdown, visibility, and accountability clear.

The product model is intentionally simple:

- A `Workspace` is the main collaboration space
- A `Project` groups related work inside a workspace
- A `Task` represents a concrete deliverable
- A `Step` breaks a task into smaller executable parts

This structure supports both planning and execution. Teams can define responsibilities, assign work, track deadlines, follow changes, and keep an audit trail of what happened and who did it.

## Why I built it

I built FlowManager as a learning project after following discussions about how software development changes when AI becomes part of the workflow. The goal was not to see how fast I could generate code. The goal was to learn how to build software responsibly with AI assistance.

The project was heavily influenced by a seven-phase development framework centered on:

- planning before implementation
- strict TDD
- explicit documentation
- controlled scope
- verification as a requirement, not an afterthought

In practice, FlowManager became both a product project and a process experiment: a way to learn how to use AI coding tools more effectively while keeping architecture, tests, and validation in control.

## Development philosophy

The most important part of this project is not only what was built, but how it was built.

### 1. Architecture first

The project started with product definition, user stories, folder structure, database design, service boundaries, and implementation rules before feature work began.

### 2. Strict TDD

Nothing meaningful was meant to be added without tests. The idea was to build a strong enough safety net that AI-assisted implementation could be reviewed and validated continuously instead of trusted blindly.

### 3. Documentation as project memory

Architecture decisions, schema conventions, product rules, API contracts, and implementation traps were documented as part of the workflow so the project could keep consistency over time.

### 4. AI as an amplifier, not a replacement for judgment

AI assistance was part of the development process from the beginning, but always under human direction. The project was used to learn how to prompt, review, constrain, verify, and refine AI-generated work instead of delegating responsibility away.

### 5. Scope discipline over feature inflation

Some ideas were intentionally cut, deferred, or left constrained by third-party costs. That was a deliberate product decision, not accidental incompleteness. The focus stayed on delivering a coherent system instead of chasing every possible feature.

## What was implemented

FlowManager covers a broad end-to-end scope for a portfolio project:

- Authentication with registration, login, refresh tokens, email verification, password reset, and temporary lock rules
- User profile management with avatar upload and timezone handling
- Workspaces with ownership transfer, member roles, invitations, and membership management
- Projects with status, archival flows, ownership, deadlines, and workspace scoping
- Tasks with assignees, labels, watchers, sequential numbering, ordering, and manual or automatic status behavior
- Steps with assignment, ordering, deadline validation, and task-level status interactions
- Threaded comments with mentions
- Labels and categorization flows
- Notifications and notification retry logic
- Dashboard metrics and activity history
- Background jobs for cleanup, expiring invitations, deadline reminders, and retrying failed notifications

## Scope status

The current version reflects the intended scope of the project after product decisions were made during development.

Most of the originally planned functionality was implemented and made functional. A small subset of stories or ideas was intentionally cut, deferred, or limited for one of these reasons:

- they depended on paid third-party services or infrastructure costs that were not worth taking on for the learning goal
- they no longer added enough product value relative to their complexity
- they were outside the most useful scope for the current version

That means the project should be read as a completed learning-driven build for its chosen scope, not as an abandoned half-finished prototype.

## Technical highlights

- TypeScript monorepo with Turborepo
- Next.js frontend and Fastify backend
- PostgreSQL with Prisma ORM
- JWT authentication with refresh tokens
- TanStack Query and Zustand on the frontend
- Layered backend architecture with controller, service, repository, and schema separation
- Swagger/OpenAPI documentation for the API
- Background job runner and scheduled jobs
- Sentry integration on the backend
- Test-first workflow with Vitest and Testing Library

## API documentation

The backend exposes interactive API documentation through Swagger UI:

- Local Swagger: [http://localhost:3001/docs](http://localhost:3001/docs)

For reviewers, this is the fastest way to inspect the backend surface area. The documented API covers:

- auth
- users
- workspaces
- projects
- tasks
- steps
- comments
- labels
- invitations
- notifications
- dashboard
- activity logs

Swagger was treated as part of the engineering workflow, not as decoration. The API documentation is backed by route schemas and documentation-focused tests to reduce drift between implementation and contract.

## Architecture overview

FlowManager is organized as a monorepo:

```text
apps/
  api/        backend application
  web/        frontend application
packages/
  types/      shared domain and API types
  shared/     shared constants and utilities
docs/         project documentation
```

The backend follows a layered structure:

- `controller`: receives requests and returns responses
- `service`: contains business logic
- `repository`: handles database access through Prisma
- `schema`: defines validation and API contracts

This structure was chosen to keep business rules explicit and easier to test.

## Product and engineering decisions

A few examples of deliberate rules that shape the project:

- soft delete on major entities
- cursor-based pagination
- hashed token storage
- automatic task status derived from step completion unless manually overridden
- step deadlines cannot exceed task deadlines
- sequential task numbering per project
- order recalculation after deletions
- immutable activity history

These rules matter more than a generic CRUD surface because they show domain modeling, consistency, and system behavior under real constraints.

## Portfolio value

FlowManager is meant to demonstrate more than the ability to build screens and endpoints.

It represents experience with:

- domain modeling and product scoping
- API design and documentation
- full-stack TypeScript architecture
- test-driven development
- working with AI assistance under guardrails
- making tradeoffs instead of endlessly expanding scope
- documenting decisions and maintaining project memory

For a recruiter or reviewer, the project is best understood as a disciplined engineering exercise wrapped in a real application.

## Current limitations

- The frontend is functional for the current cycle, but a larger UI refactor is planned.
- Some non-core ideas were intentionally removed from scope.
- Some capabilities were constrained by external service costs rather than implementation difficulty.

None of these limitations change the main goal of the project: learning how to build a coherent, validated software system with AI-assisted workflows.

## Running locally

```bash
npm install
npm run dev
```

With the environment configured:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Swagger UI: `http://localhost:3001/docs`

Required environment variables are documented in [.env.example](./.env.example).

## Additional documentation

- [Database schema reference](./docs/database.md)
- [User stories](./docs/stories.md)
- [Swagger conventions](./docs/swagger.md)

## Closing note

FlowManager was built to learn how to use AI in software development without sacrificing engineering standards. If the project communicates anything well, I hope it is this: AI can accelerate implementation, but reliability still depends on architecture, tests, documentation, and judgment.

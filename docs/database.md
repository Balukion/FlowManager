# FlowManager - Database Schema

Reference document for the FlowManager database schema.

Sources of truth:

- relational structure and nullability: `apps/api/prisma/schema.prisma`
- API contracts: Swagger at `/docs`

This file exists as a human-friendly reference and should stay aligned with `schema.prisma`.

---

## Enums

### OAuthProvider

`GOOGLE | GITHUB`

### Role

`ADMIN | MEMBER`

### InvitationStatus

`PENDING | VIEWED | ACCEPTED | EXPIRED | DECLINED`

### ProjectStatus

`ACTIVE | ARCHIVED`

### TaskStatus

`TODO | IN_PROGRESS | DONE`

### StepStatus

`PENDING | IN_PROGRESS | DONE`

### Priority

`LOW | MEDIUM | HIGH`

### NotificationType

`STEP_ASSIGNED | DEADLINE_APPROACHING | TASK_STATUS_CHANGED | WORKSPACE_INVITATION | COMMENT_MENTION`

### ActivityAction

`WORKSPACE_CREATED | WORKSPACE_UPDATED | WORKSPACE_DELETED | OWNERSHIP_TRANSFERRED | MEMBER_ADDED | MEMBER_REMOVED | MEMBER_ROLE_CHANGED | PROJECT_CREATED | PROJECT_UPDATED | PROJECT_ARCHIVED | PROJECT_UNARCHIVED | PROJECT_DELETED | TASK_CREATED | TASK_UPDATED | TASK_DELETED | TASK_MOVED | TASK_STATUS_CHANGED | TASK_PRIORITY_CHANGED | TASK_ASSIGNEE_CHANGED | TASK_REORDERED | STEP_CREATED | STEP_UPDATED | STEP_DELETED | STEP_STATUS_CHANGED | STEP_REORDERED | STEP_ASSIGNED | STEP_UNASSIGNED | COMMENT_CREATED | COMMENT_EDITED | COMMENT_DELETED | LABEL_CREATED | LABEL_UPDATED | LABEL_DELETED | TASK_LABEL_ADDED | TASK_LABEL_REMOVED | INVITATION_SENT | INVITATION_ACCEPTED | INVITATION_DECLINED | INVITATION_CANCELLED | INVITATION_RESENT`

---

## Indexes and constraints

### Indexes declared in Prisma

```text
users.deleted_at
workspace_members.user_id
projects.deleted_at
tasks.project_id
tasks.deleted_at
steps.task_id
steps.deleted_at
activity_logs.project_id
activity_logs.task_id
notifications.user_id
```

### Unique constraints and composite keys

```text
users.email - unique
workspaces.slug - unique
workspace_members (workspace_id, user_id) - unique
projects (workspace_id, slug) - unique
step_assignments (step_id, user_id) - unique
comment_mentions (comment_id, user_id) - unique
task_labels (task_id, label_id) - composite primary key
task_watchers (task_id, user_id) - composite primary key
```

---

## Tables

### users

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| id | UUID | Yes | Unique identifier |
| name | String | Yes | Full name |
| email | String | Yes - unique | User email |
| password_hash | String | Yes | Password hash |
| avatar_url | String | No | User avatar |
| timezone | String | Yes | Timezone. Default: `UTC` |
| email_verified | Boolean | Yes | Whether the email was verified. Default: `false` |
| email_verified_at | DateTime | No | Email verification timestamp |
| email_verification_token | String | No | Email verification token hash |
| email_verification_expires_at | DateTime | No | Email verification token expiration |
| password_reset_token | String | No | Password reset token hash |
| password_reset_expires_at | DateTime | No | Password reset token expiration |
| password_changed_at | DateTime | No | Last password change |
| failed_login_attempts | Int | Yes | Failed login attempts. Default: `0` |
| locked_until | DateTime | No | Temporary login lock |
| settings | Json | No | Future settings |
| created_at | DateTime | Yes | Creation timestamp |
| updated_at | DateTime | Yes | Last update timestamp |
| deleted_at | DateTime | No | Soft delete timestamp |

### refresh_tokens

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| id | UUID | Yes | Unique identifier |
| user_id | UUID | Yes | Owner user |
| token_hash | String | Yes | Refresh token hash |
| ip_address | String | No | Source IP |
| user_agent | String | No | Device or browser |
| expires_at | DateTime | Yes | Expiration timestamp |
| created_at | DateTime | Yes | Creation timestamp |

### revoked_tokens

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| id | UUID | Yes | Unique identifier |
| token_hash | String | Yes | Revoked access token hash |
| revoked_at | DateTime | Yes | Revocation timestamp. Default: `now()` |
| expires_at | DateTime | Yes | When it can be removed from the blacklist |

### user_oauth_accounts

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| id | UUID | Yes | Unique identifier |
| user_id | UUID | Yes | Linked user |
| provider | OAuthProvider | Yes | OAuth provider |
| provider_user_id | String | Yes | External provider user ID |
| created_at | DateTime | Yes | Creation timestamp |

### workspaces

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| id | UUID | Yes | Unique identifier |
| name | String | Yes | Workspace name |
| slug | String | Yes - unique | Public slug |
| description | String | No | Description |
| color | String | No | Visual color |
| logo_url | String | No | Workspace logo |
| owner_id | UUID | Yes | Current workspace owner |
| settings | Json | No | Future settings |
| created_at | DateTime | Yes | Creation timestamp |
| updated_at | DateTime | Yes | Last update timestamp |
| deleted_at | DateTime | No | Soft delete timestamp |

### workspace_members

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| id | UUID | Yes | Unique identifier |
| workspace_id | UUID | Yes | Workspace ID |
| user_id | UUID | Yes | Member user ID |
| role | Role | Yes | Workspace role |
| position | Int | No | Ordering position |
| last_seen_at | DateTime | No | Last workspace access |
| joined_at | DateTime | Yes | Join timestamp. Default: `now()` |

Relevant constraint: `(workspace_id, user_id)` is unique.

### invitations

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| id | UUID | Yes | Unique identifier |
| workspace_id | UUID | Yes | Target workspace |
| invited_by | UUID | Yes | User who sent the invitation |
| email | String | Yes | Invited email |
| role | Role | Yes | Offered role |
| token_hash | String | Yes | Invitation token hash |
| status | InvitationStatus | Yes | Invitation status. Default: `PENDING` |
| expires_at | DateTime | Yes | Expiration timestamp |
| viewed_at | DateTime | No | When the link was viewed |
| accepted_at | DateTime | No | When the invitation was accepted |
| declined_at | DateTime | No | When the invitation was declined |
| created_at | DateTime | Yes | Creation timestamp |

### projects

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| id | UUID | Yes | Unique identifier |
| workspace_id | UUID | Yes | Parent workspace |
| owner_id | UUID | No | Project owner |
| name | String | Yes | Project name |
| slug | String | Yes | Slug unique within the workspace |
| description | String | No | Description |
| color | String | No | Project color |
| status | ProjectStatus | Yes | Project status. Default: `ACTIVE` |
| deadline | DateTime | No | Deadline |
| created_by | UUID | Yes | Creator user |
| archived_at | DateTime | No | Archive timestamp |
| created_at | DateTime | Yes | Creation timestamp |
| updated_at | DateTime | Yes | Last update timestamp |
| deleted_at | DateTime | No | Soft delete timestamp |

Relevant constraint: `(workspace_id, slug)` is unique.

### tasks

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| id | UUID | Yes | Unique identifier |
| project_id | UUID | Yes | Parent project |
| assignee_id | UUID | No | Direct assignee |
| title | String | Yes | Task title |
| number | Int | Yes | Sequential number per project |
| description | String | No | Detailed description |
| status | TaskStatus | Yes | Task status. Default: `TODO` |
| priority | Priority | Yes | Priority. Default: `LOW` |
| order | Int | Yes | Ordering inside the project |
| deadline | DateTime | No | Deadline |
| due_reminder_sent_at | DateTime | No | Deadline reminder control |
| status_is_manual | Boolean | Yes | Whether status is manually locked. Default: `false` |
| status_overridden_by | UUID | No | User who overrode the status |
| status_overridden_at | DateTime | No | Override timestamp |
| created_by | UUID | Yes | Creator user |
| created_at | DateTime | Yes | Creation timestamp |
| updated_at | DateTime | Yes | Last update timestamp |
| deleted_at | DateTime | No | Soft delete timestamp |

### steps

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| id | UUID | Yes | Unique identifier |
| task_id | UUID | Yes | Parent task |
| title | String | Yes | Step title |
| description | String | No | Description |
| status | StepStatus | Yes | Step status. Default: `PENDING` |
| order | Int | Yes | Ordering inside the task |
| deadline | DateTime | No | Step deadline |
| due_reminder_sent_at | DateTime | No | Reminder control |
| created_by | UUID | Yes | Creator user |
| created_at | DateTime | Yes | Creation timestamp |
| updated_at | DateTime | Yes | Last update timestamp |
| deleted_at | DateTime | No | Soft delete timestamp |

### step_assignments

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| id | UUID | Yes | Unique identifier |
| step_id | UUID | Yes | Assigned step |
| user_id | UUID | Yes | Assigned user |
| assigned_by | UUID | Yes | User who assigned the step |
| assigned_at | DateTime | Yes | Assignment timestamp. Default: `now()` |
| unassigned_by | UUID | No | User who removed the assignment |
| unassigned_at | DateTime | No | Unassignment timestamp |

Relevant constraint: `(step_id, user_id)` is unique.

### comments

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| id | UUID | Yes | Unique identifier |
| task_id | UUID | Yes | Related task |
| user_id | UUID | Yes | Comment author |
| parent_id | UUID | No | Parent comment for threading |
| content | String | Yes | Comment content |
| edited_at | DateTime | No | Edit timestamp |
| deleted_by | UUID | No | User who deleted the comment |
| created_at | DateTime | Yes | Creation timestamp |
| updated_at | DateTime | Yes | Last update timestamp |
| deleted_at | DateTime | No | Soft delete timestamp |

### comment_mentions

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| id | UUID | Yes | Unique identifier |
| comment_id | UUID | Yes | Comment where the mention happened |
| user_id | UUID | Yes | Mentioned user |
| created_at | DateTime | Yes | Creation timestamp |

Relevant constraint: `(comment_id, user_id)` is unique.

### labels

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| id | UUID | Yes | Unique identifier |
| workspace_id | UUID | Yes | Workspace owner |
| name | String | Yes | Label name |
| color | String | Yes | Label color |
| created_by | UUID | Yes | Creator user |
| created_at | DateTime | Yes | Creation timestamp |
| deleted_at | DateTime | No | Soft delete timestamp |

### task_labels

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| task_id | UUID | Yes | Task ID |
| label_id | UUID | Yes | Label ID |

Composite primary key: `(task_id, label_id)`.

### task_watchers

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| task_id | UUID | Yes | Watched task |
| user_id | UUID | Yes | Watcher user |
| created_at | DateTime | Yes | Creation timestamp |

Composite primary key: `(task_id, user_id)`.

### activity_logs

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| id | UUID | Yes | Unique identifier |
| workspace_id | UUID | No | Related workspace |
| project_id | UUID | No | Related project |
| task_id | UUID | No | Related task |
| user_id | UUID | Yes | User who performed the action |
| action | ActivityAction | Yes | Recorded action type |
| entity_type | String | No | Affected entity type |
| entity_id | UUID | No | Affected entity ID |
| metadata | Json | No | Additional action context |
| created_at | DateTime | Yes | Creation timestamp |

Note: `activity_logs` does not have `deleted_at`.

### notifications

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| id | UUID | Yes | Unique identifier |
| user_id | UUID | Yes | Recipient user |
| type | NotificationType | Yes | Notification type |
| title | String | Yes | Display title |
| body | String | Yes | Notification body |
| entity_type | String | No | Related entity type |
| entity_id | UUID | No | Related entity ID |
| read_at | DateTime | No | When the notification was marked as read |
| sent_at | DateTime | No | When delivery was completed |
| failed_at | DateTime | No | When delivery failed |
| error_message | String | No | Delivery error message |
| attempt_count | Int | Yes | Delivery attempt count. Default: `0` |
| created_at | DateTime | Yes | Creation timestamp |

---

## Modeling notes

- The database uses soft delete in `users`, `workspaces`, `projects`, `tasks`, `steps`, and `labels`.
- `activity_logs` and `notifications` do not use soft delete.
- `task_labels` and `task_watchers` are relationship tables with composite primary keys.
- `comments` supports threading through a self-relation via `parent_id`.
- `activity_logs` uses optional relations with `onDelete: SetNull` so historical records survive related deletions.

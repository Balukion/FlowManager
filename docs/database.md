# FlowManager — Schema do Banco de Dados

Schema completo para referência do agente.
Use este arquivo para gerar o `prisma/schema.prisma`.

---

## Índices obrigatórios

```
tasks.project_id
tasks.deleted_at
steps.task_id
steps.deleted_at
workspace_members.user_id
workspace_members (workspace_id + user_id) — único
activity_logs.project_id
activity_logs.task_id
notifications.user_id
users.email — único
users.deleted_at
workspaces.slug — único
workspaces.deleted_at
projects.slug — único por workspace
projects.deleted_at
step_assignments (step_id + user_id) — único
task_watchers (task_id + user_id) — único
task_labels (task_id + label_id) — único
comment_mentions (comment_id + user_id) — único
```

---

## Tabelas

### users
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Identificador único |
| name | String | Sim | Nome completo |
| email | String | Sim — único | Email normalizado para lowercase |
| password_hash | String | Sim | Senha com bcrypt |
| avatar_url | String | Não | Foto — nulo usa DiceBear |
| timezone | String | Sim | Fuso horário — padrão UTC |
| email_verified | Boolean | Sim | Padrão false |
| email_verified_at | DateTime | Não | Quando confirmou |
| email_verification_token | String | Não | Token de verificação |
| email_verification_expires_at | DateTime | Não | Expiração do token |
| password_reset_token | String | Não | Token de recuperação |
| password_reset_expires_at | DateTime | Não | Expiração do token |
| password_changed_at | DateTime | Não | Última troca de senha |
| failed_login_attempts | Integer | Sim | Padrão 0 |
| locked_until | DateTime | Não | Bloqueio temporário |
| settings | JSON | Não | Configurações futuras |
| created_at | DateTime | Sim | Criação |
| updated_at | DateTime | Sim | Última atualização |
| deleted_at | DateTime | Não | Soft delete 30 dias |

---

### refresh_tokens
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Identificador único |
| user_id | UUID | Sim | Referência ao usuário |
| token_hash | String | Sim | Hash do token — nunca o valor real |
| ip_address | String | Não | IP do dispositivo |
| user_agent | String | Não | Navegador/dispositivo |
| expires_at | DateTime | Sim | Expiração |
| created_at | DateTime | Sim | Criação |

---

### revoked_tokens
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Identificador único |
| token_hash | String | Sim | Hash do access token revogado |
| revoked_at | DateTime | Sim | Quando foi revogado |
| expires_at | DateTime | Sim | Quando pode ser deletado da blacklist |

---

### user_oauth_accounts
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Identificador único |
| user_id | UUID | Sim | Referência ao usuário |
| provider | Enum | Sim | GOOGLE, GITHUB |
| provider_user_id | String | Sim | ID externo do provider |
| created_at | DateTime | Sim | Criação |

*Tabela preparada para OAuth futuro — vazia por enquanto.*

---

### workspaces
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Identificador único |
| name | String | Sim | Nome |
| slug | String | Sim — único global | URL amigável gerado do nome |
| description | String | Não | Descrição |
| color | String | Não | Cor hex — padrão aleatório na criação |
| logo_url | String | Não | Logo — nulo usa DiceBear |
| owner_id | UUID | Sim | Super admin atual |
| settings | JSON | Não | Configurações futuras |
| created_at | DateTime | Sim | Criação |
| updated_at | DateTime | Sim | Última atualização |
| deleted_at | DateTime | Não | Soft delete 30 dias |

---

### workspace_members
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Identificador único |
| workspace_id | UUID | Sim | Referência ao workspace |
| user_id | UUID | Sim | Referência ao usuário |
| role | Enum | Sim | ADMIN, MEMBER |
| position | Integer | Não | Ordem na listagem |
| last_seen_at | DateTime | Não | Último acesso ao workspace |
| joined_at | DateTime | Sim | Quando entrou |

*Combinação (workspace_id + user_id) é única.*

---

### invitations
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Identificador único |
| workspace_id | UUID | Sim | Referência ao workspace |
| invited_by | UUID | Sim | Quem convidou |
| email | String | Sim | Email do convidado |
| role | Enum | Sim | ADMIN, MEMBER |
| token_hash | String | Sim | Hash do token do link |
| status | Enum | Sim | PENDING, VIEWED, ACCEPTED, EXPIRED, DECLINED |
| expires_at | DateTime | Sim | Expiração |
| viewed_at | DateTime | Não | Quando abriu o link |
| accepted_at | DateTime | Não | Quando aceitou |
| declined_at | DateTime | Não | Quando recusou |
| created_at | DateTime | Sim | Criação |

---

### projects
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Identificador único |
| workspace_id | UUID | Sim | Referência ao workspace |
| owner_id | UUID | Não | Responsável pelo projeto |
| name | String | Sim | Nome |
| slug | String | Sim — único por workspace | URL amigável gerado do nome |
| description | String | Não | Descrição |
| color | String | Não | Cor de identificação |
| status | Enum | Sim | ACTIVE, ARCHIVED — padrão ACTIVE |
| deadline | DateTime | Não | Prazo |
| created_by | UUID | Sim | Quem criou |
| archived_at | DateTime | Não | Quando foi arquivado |
| created_at | DateTime | Sim | Criação |
| updated_at | DateTime | Sim | Última atualização |
| deleted_at | DateTime | Não | Soft delete 30 dias |

---

### tasks
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Identificador único |
| project_id | UUID | Sim | Referência ao projeto |
| assignee_id | UUID | Não | Responsável direto |
| title | String | Sim | Título |
| number | Integer | Sim | Número sequencial por projeto — incrementar ao criar |
| description | String | Não | Descrição |
| status | Enum | Sim | TODO, IN_PROGRESS, DONE |
| priority | Enum | Sim | LOW, MEDIUM, HIGH — padrão LOW |
| order | Integer | Sim | Posição na lista do projeto |
| deadline | DateTime | Não | Prazo |
| due_reminder_sent_at | DateTime | Não | Controle de lembrete — evita duplicatas |
| status_is_manual | Boolean | Sim | Padrão false — controla se status é automático ou manual |
| status_overridden_by | UUID | Não | Quem sobrescreveu manualmente |
| status_overridden_at | DateTime | Não | Quando sobrescreveu |
| created_by | UUID | Sim | Quem criou |
| created_at | DateTime | Sim | Criação |
| updated_at | DateTime | Sim | Última atualização |
| deleted_at | DateTime | Não | Soft delete 30 dias |

---

### steps
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Identificador único |
| task_id | UUID | Sim | Referência à tarefa |
| title | String | Sim | Título |
| description | String | Não | Descrição |
| status | Enum | Sim | PENDING, IN_PROGRESS, DONE |
| order | Integer | Sim | Posição — reajustado automaticamente após deleção |
| deadline | DateTime | Não | Prazo — não pode ser posterior ao prazo da tarefa |
| due_reminder_sent_at | DateTime | Não | Controle de lembrete — evita duplicatas |
| created_by | UUID | Sim | Quem criou |
| created_at | DateTime | Sim | Criação |
| updated_at | DateTime | Sim | Última atualização |
| deleted_at | DateTime | Não | Soft delete 30 dias |

---

### step_assignments
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Identificador único |
| step_id | UUID | Sim | Referência ao passo |
| user_id | UUID | Sim | Referência ao membro |
| assigned_by | UUID | Sim | Quem atribuiu |
| assigned_at | DateTime | Sim | Quando foi atribuído |
| unassigned_by | UUID | Não | Quem removeu |
| unassigned_at | DateTime | Não | Quando foi removido |

*Combinação (step_id + user_id) é única.*
*Não deletar ao remover membro — preencher unassigned_at e unassigned_by.*

---

### comments
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Identificador único |
| task_id | UUID | Sim | Referência à tarefa |
| user_id | UUID | Sim | Quem comentou |
| parent_id | UUID | Não | Referência ao comentário pai — threading de 1 nível |
| content | String | Sim | Conteúdo |
| edited_at | DateTime | Não | Quando foi editado |
| deleted_by | UUID | Não | Quem deletou |
| created_at | DateTime | Sim | Criação |
| updated_at | DateTime | Sim | Última atualização |
| deleted_at | DateTime | Não | Soft delete — conteúdo substituído por mensagem padrão na UI |

---

### comment_mentions
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Identificador único |
| comment_id | UUID | Sim | Referência ao comentário |
| user_id | UUID | Sim | Quem foi mencionado |
| created_at | DateTime | Sim | Criação |

*Combinação (comment_id + user_id) é única.*

---

### labels
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Identificador único |
| workspace_id | UUID | Sim | Referência ao workspace |
| name | String | Sim | Nome da label |
| color | String | Sim | Cor obrigatória — conjunto pré-definido de cores |
| created_by | UUID | Sim | Quem criou |
| created_at | DateTime | Sim | Criação |
| deleted_at | DateTime | Não | Soft delete 30 dias |

---

### task_labels
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| task_id | UUID | Sim | Referência à tarefa |
| label_id | UUID | Sim | Referência à label |

*Combinação (task_id + label_id) é única.*

---

### task_watchers
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| task_id | UUID | Sim | Referência à tarefa |
| user_id | UUID | Sim | Referência ao membro |
| created_at | DateTime | Sim | Criação |

*Combinação (task_id + user_id) é única.*

---

### activity_logs
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Identificador único |
| workspace_id | UUID | Sim | Referência ao workspace |
| project_id | UUID | Não | Referência ao projeto |
| task_id | UUID | Não | Referência à tarefa |
| user_id | UUID | Sim | Quem executou |
| action | Enum | Sim | Tipo da ação — ver lista de enums |
| entity_type | String | Sim | O que foi afetado — ex: TASK, STEP, COMMENT |
| entity_id | UUID | Sim | ID do registro afetado |
| metadata | JSON | Não | Contexto extra — ver padrão no CLAUDE.md |
| created_at | DateTime | Sim | Quando aconteceu |

*Sem soft delete — registro imutável.*

---

### notifications
| Coluna | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | UUID | Sim | Identificador único |
| user_id | UUID | Sim | Quem recebe |
| type | Enum | Sim | Tipo da notificação |
| entity_type | String | Sim | O que disparou |
| entity_id | UUID | Sim | ID do registro que disparou |
| sent_at | DateTime | Não | Quando foi enviado — nulo se ainda não enviado |
| failed_at | DateTime | Não | Quando falhou |
| error_message | String | Não | Mensagem de erro |
| created_at | DateTime | Sim | Criação |

*Deletadas permanentemente após 90 dias via job.*

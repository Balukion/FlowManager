import { Button } from "@web/components/ui/button";
import { Label } from "@web/components/ui/label";

const ACTION_OPTIONS = [
  { value: "TASK_CREATED", label: "Tarefa criada" },
  { value: "TASK_UPDATED", label: "Tarefa editada" },
  { value: "TASK_DELETED", label: "Tarefa deletada" },
  { value: "TASK_STATUS_CHANGED", label: "Status alterado" },
  { value: "TASK_PRIORITY_CHANGED", label: "Prioridade alterada" },
  { value: "STEP_CREATED", label: "Passo criado" },
  { value: "STEP_DELETED", label: "Passo deletado" },
  { value: "STEP_ASSIGNED", label: "Passo atribuído" },
  { value: "STEP_UNASSIGNED", label: "Atribuição removida" },
  { value: "COMMENT_CREATED", label: "Comentário adicionado" },
  { value: "COMMENT_EDITED", label: "Comentário editado" },
  { value: "COMMENT_DELETED", label: "Comentário removido" },
  { value: "MEMBER_ROLE_CHANGED", label: "Papel alterado" },
];

const EMPTY_FILTERS = { user_id: "", action: "", from: "", to: "" };

export interface Filters {
  user_id: string;
  action: string;
  from: string;
  to: string;
}

interface ActivityFiltersProps {
  members: { id: string; name: string }[];
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function ActivityFilters({ members, filters, onChange }: ActivityFiltersProps) {
  function update(patch: Partial<Filters>) {
    onChange({ ...filters, ...patch });
  }

  const hasActiveFilter = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
      <div className="space-y-1">
        <Label htmlFor="filter-member" className="text-xs">Membro</Label>
        <select
          id="filter-member"
          aria-label="Membro"
          value={filters.user_id}
          onChange={(e) => update({ user_id: e.target.value })}
          className="rounded-md border bg-background px-2 py-1 text-sm"
        >
          <option value="">Todos</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-action" className="text-xs">Tipo</Label>
        <select
          id="filter-action"
          aria-label="Tipo"
          value={filters.action}
          onChange={(e) => update({ action: e.target.value })}
          className="rounded-md border bg-background px-2 py-1 text-sm"
        >
          <option value="">Todos</option>
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-from" className="text-xs">De</Label>
        <input
          id="filter-from"
          type="date"
          value={filters.from}
          onChange={(e) => update({ from: e.target.value })}
          className="rounded-md border bg-background px-2 py-1 text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-to" className="text-xs">Até</Label>
        <input
          id="filter-to"
          type="date"
          value={filters.to}
          onChange={(e) => update({ to: e.target.value })}
          className="rounded-md border bg-background px-2 py-1 text-sm"
        />
      </div>

      {hasActiveFilter && (
        <Button size="sm" variant="ghost" onClick={() => onChange(EMPTY_FILTERS)}>
          Limpar
        </Button>
      )}
    </div>
  );
}

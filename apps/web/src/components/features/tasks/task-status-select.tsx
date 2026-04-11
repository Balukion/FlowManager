const STATUS_OPTIONS = [
  { value: "TODO", label: "A fazer" },
  { value: "IN_PROGRESS", label: "Em progresso" },
  { value: "DONE", label: "Concluída" },
];

interface TaskStatusSelectProps {
  status: string;
  onChange: (status: string) => void;
  disabled?: boolean;
}

export function TaskStatusSelect({ status, onChange, disabled }: TaskStatusSelectProps) {
  return (
    <select
      value={status}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border bg-background px-2 py-1 text-sm"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

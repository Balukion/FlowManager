interface LabelBadgeProps {
  name: string;
  color: string;
  onRemove?: () => void;
}

export function LabelBadge({ name, color, onRemove }: LabelBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover label ${name}`}
          className="ml-0.5 rounded-full hover:opacity-75 focus:outline-none"
        >
          ×
        </button>
      )}
    </span>
  );
}

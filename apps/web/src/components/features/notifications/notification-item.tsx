interface Notification {
  id: string;
  title: string;
  body: string;
  read_at: Date | null;
  created_at: Date;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const isUnread = !notification.read_at;

  return (
    <div className={`flex gap-3 rounded-md p-3 ${isUnread ? "bg-muted/60" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {isUnread && (
            <span
              role="status"
              aria-label="Não lida"
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium">{notification.title}</p>
            <p className="text-xs text-muted-foreground">{notification.body}</p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-start gap-1">
        {isUnread && (
          <button
            type="button"
            onClick={() => onMarkAsRead(notification.id)}
            aria-label="Marcar como lida"
            className="rounded p-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Marcar como lida"
          >
            ✓
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(notification.id)}
          aria-label="Remover notificação"
          className="rounded p-1 text-xs text-muted-foreground hover:bg-muted hover:text-destructive"
          title="Remover"
        >
          ×
        </button>
      </div>
    </div>
  );
}

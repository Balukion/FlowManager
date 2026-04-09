interface CommentUser {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  edited_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  user: CommentUser;
}

interface CommentListProps {
  comments: Comment[];
  currentUserId: string;
  onDelete: (commentId: string) => void;
}

export function CommentList({ comments, currentUserId, onDelete }: CommentListProps) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum comentário ainda</p>;
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => (
        <li key={comment.id} className="rounded-md border bg-card p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium">{comment.user.name}</p>
            {comment.user_id === currentUserId && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-muted-foreground hover:text-destructive"
                aria-label="Excluir"
              >
                Excluir
              </button>
            )}
          </div>
          <p className="mt-1 text-sm">{comment.content}</p>
        </li>
      ))}
    </ul>
  );
}

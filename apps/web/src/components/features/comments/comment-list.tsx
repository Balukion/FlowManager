"use client";

import { useState } from "react";
import { Button } from "@web/components/ui/button";
import { MentionTextarea, type MentionMember } from "./mention-textarea";

interface CommentUser {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  task_id: string;
  parent_id?: string | null;
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
  members?: MentionMember[];
  onDelete: (commentId: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onReply?: (parentId: string, content: string, mentions: string[]) => void;
}

export function CommentList({ comments, currentUserId, members = [], onDelete, onEdit, onReply }: CommentListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyMentions, setReplyMentions] = useState<string[]>([]);

  function startEdit(comment: Comment) {
    setEditingId(comment.id);
    setEditContent(comment.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent("");
  }

  function saveEdit(commentId: string) {
    onEdit?.(commentId, editContent);
    setEditingId(null);
    setEditContent("");
  }

  function startReply(commentId: string) {
    setReplyingToId(commentId);
    setReplyContent("");
    setReplyMentions([]);
  }

  function cancelReply() {
    setReplyingToId(null);
    setReplyContent("");
    setReplyMentions([]);
  }

  function submitReply(parentId: string) {
    onReply?.(parentId, replyContent, replyMentions);
    setReplyingToId(null);
    setReplyContent("");
    setReplyMentions([]);
  }

  const topLevel = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum comentário ainda</p>;
  }

  function renderComment(comment: Comment, isReply: boolean) {
    const isDeleted = !!comment.deleted_at;
    const isOwn = comment.user_id === currentUserId;
    const isEditing = editingId === comment.id;

    return (
      <div className={`rounded-md border bg-card p-3 ${isReply ? "border-l-2 border-l-muted" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{comment.user.name}</p>
            {isReply && (
              <span className="text-xs text-muted-foreground">respondeu</span>
            )}
            {comment.edited_at && !isDeleted && (
              <span className="text-xs text-muted-foreground">(editado)</span>
            )}
          </div>
          {!isDeleted && (
            <div className="flex gap-1">
              {onReply && !isReply && (
                <button
                  onClick={() => startReply(comment.id)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                  aria-label="Responder"
                >
                  Responder
                </button>
              )}
              {isOwn && onEdit && !isEditing && (
                <button
                  onClick={() => startEdit(comment)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                  aria-label="Editar"
                >
                  Editar
                </button>
              )}
              {isOwn && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                  aria-label="Excluir"
                >
                  Excluir
                </button>
              )}
            </div>
          )}
        </div>

        {isDeleted ? (
          <p className="mt-1 text-sm italic text-muted-foreground">Comentário removido</p>
        ) : isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => saveEdit(comment.id)}>Salvar</Button>
              <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm">{comment.content}</p>
        )}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {topLevel.map((comment) => {
        const replies = getReplies(comment.id);
        const isReplying = replyingToId === comment.id;

        return (
          <li key={comment.id}>
            {renderComment(comment, false)}

            {replies.length > 0 && (
              <ul className="ml-6 mt-2 space-y-2">
                {replies.map((reply) => (
                  <li key={reply.id}>{renderComment(reply, true)}</li>
                ))}
              </ul>
            )}

            {isReplying && (
              <div className="ml-6 mt-2 space-y-2">
                <MentionTextarea
                  value={replyContent}
                  onChange={setReplyContent}
                  onMentionsChange={setReplyMentions}
                  members={members}
                  placeholder="Escreva sua resposta..."
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => submitReply(comment.id)}>Enviar</Button>
                  <Button size="sm" variant="ghost" onClick={cancelReply}>Cancelar</Button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

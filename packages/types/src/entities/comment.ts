export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  edited_at: Date | null;
  deleted_by: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CommentMention {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: Date;
}

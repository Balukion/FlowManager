interface Comment {
    id: string;
    task_id: string;
    user_id: string;
    content: string;
    parent_id: string | null;
    edited_at: Date | null;
    deleted_at: Date | null;
    deleted_by: string | null;
    created_at: Date;
}
export declare function makeComment(overrides?: Partial<Comment>): Comment;
export {};
//# sourceMappingURL=comment.factory.d.ts.map
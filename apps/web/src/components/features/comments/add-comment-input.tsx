"use client";

import { useState } from "react";
import { Button } from "@web/components/ui/button";
import { Label } from "@web/components/ui/label";
import { MentionTextarea } from "@web/components/features/comments/mention-textarea";
import type { MemberWithUser } from "@flowmanager/types";

interface AddCommentInputProps {
  members: MemberWithUser[];
  onSubmit: (content: string, mentions: string[]) => Promise<unknown> | void;
}

export function AddCommentInput({ members, onSubmit }: AddCommentInputProps) {
  const [value, setValue] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);

  async function handleSubmit() {
    const content = value.trim();
    if (!content) return;
    try {
      await onSubmit(content, mentions);
      setValue("");
      setMentions([]);
    } catch {
      // mantém o conteúdo para que o usuário possa tentar novamente
    }
  }

  return (
    <div className="space-y-2">
      <Label>Novo comentário</Label>
      <MentionTextarea
        value={value}
        onChange={setValue}
        onMentionsChange={setMentions}
        members={members}
        placeholder="Escreva um comentário... Use @ para mencionar alguém"
        rows={3}
      />
      <Button onClick={handleSubmit} disabled={!value.trim()}>
        Enviar
      </Button>
    </div>
  );
}

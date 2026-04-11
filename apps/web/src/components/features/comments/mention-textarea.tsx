"use client";

import { useRef, useState } from "react";

export interface MentionMember {
  user_id: string;
  user: { id: string; name: string };
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange: (userIds: string[]) => void;
  members: MentionMember[];
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

function getActiveQuery(text: string, cursorPos: number): string | null {
  const textBefore = text.slice(0, cursorPos);
  const match = textBefore.match(/@(\S*)$/);
  return match ? match[1] : null;
}

function extractMentionedUserIds(text: string, members: MentionMember[]): string[] {
  return members
    .filter((m) => text.includes(`@${m.user.name}`))
    .map((m) => m.user_id);
}

export function MentionTextarea({
  value,
  onChange,
  onMentionsChange,
  members,
  placeholder,
  disabled,
  rows = 3,
}: MentionTextareaProps) {
  const [query, setQuery] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestions =
    query !== null
      ? members.filter((m) =>
          m.user.name.toLowerCase().startsWith(query.toLowerCase()),
        )
      : [];

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart ?? newValue.length;
    onChange(newValue);
    setQuery(getActiveQuery(newValue, cursorPos));
    onMentionsChange(extractMentionedUserIds(newValue, members));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      setQuery(null);
    }
  }

  function selectMember(member: MentionMember) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart ?? value.length;
    const textBefore = value.slice(0, cursorPos);
    const textAfter = value.slice(cursorPos);
    const newBefore = textBefore.replace(/@(\S*)$/, `@${member.user.name} `);
    const newValue = newBefore + textAfter;

    onChange(newValue);
    onMentionsChange(extractMentionedUserIds(newValue, members));
    setQuery(null);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const pos = newBefore.length;
        textareaRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setQuery(null)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      />
      {query !== null && suggestions.length > 0 && (
        <ul
          role="listbox"
          aria-label="Sugestões de menção"
          className="absolute left-0 top-full z-10 mt-1 min-w-[160px] rounded-md border bg-popover shadow-md"
        >
          {suggestions.map((m) => (
            <li key={m.user_id} role="option">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevents textarea blur in real browsers
                  selectMember(m);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectMember(m);
                  }
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
              >
                {m.user.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

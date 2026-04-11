import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { MentionTextarea } from "./mention-textarea";

interface Member {
  user_id: string;
  user: { id: string; name: string };
}

const defaultMembers: Member[] = [
  { user_id: "u-1", user: { id: "u-1", name: "Alice" } },
  { user_id: "u-2", user: { id: "u-2", name: "Bob" } },
  { user_id: "u-3", user: { id: "u-3", name: "Carlos" } },
];

function setup(members: Member[] = defaultMembers, onMentionsChange = vi.fn()) {
  function Wrapper() {
    const [value, setValue] = useState("");
    return (
      <MentionTextarea
        value={value}
        onChange={setValue}
        onMentionsChange={onMentionsChange}
        members={members}
        placeholder="Escreva um comentário..."
      />
    );
  }
  render(<Wrapper />);
  const textarea = screen.getByPlaceholderText("Escreva um comentário...");
  return { textarea, onMentionsChange };
}

describe("MentionTextarea", () => {
  it("renders textarea with placeholder", () => {
    const { textarea } = setup();
    expect(textarea).toBeInTheDocument();
  });

  it("shows dropdown with all members when @ is typed", async () => {
    const { textarea } = setup();
    await userEvent.type(textarea, "@");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Carlos")).toBeInTheDocument();
  });

  it("filters members by partial name typed after @", async () => {
    const { textarea } = setup();
    await userEvent.type(textarea, "@al");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    expect(screen.queryByText("Carlos")).not.toBeInTheDocument();
  });

  it("is case-insensitive when filtering", async () => {
    const { textarea } = setup();
    await userEvent.type(textarea, "@AL");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("does not show dropdown when text has no @", async () => {
    const { textarea } = setup();
    await userEvent.type(textarea, "hello");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not show dropdown when no members match the query", async () => {
    const { textarea } = setup();
    await userEvent.type(textarea, "@xyz");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not show dropdown when members list is empty", async () => {
    const { textarea } = setup([]);
    await userEvent.type(textarea, "@");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("inserts full member name when suggestion is clicked", async () => {
    const { textarea } = setup();
    await userEvent.type(textarea, "@al");
    await userEvent.click(screen.getByText("Alice"));
    expect(textarea).toHaveValue("@Alice ");
  });

  it("hides dropdown after a member is selected", async () => {
    const { textarea } = setup();
    await userEvent.type(textarea, "@al");
    await userEvent.click(screen.getByText("Alice"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("calls onMentionsChange with matched user IDs after selection", async () => {
    const mockOnMentionsChange = vi.fn();
    const { textarea } = setup(defaultMembers, mockOnMentionsChange);
    await userEvent.type(textarea, "@al");
    await userEvent.click(screen.getByText("Alice"));
    expect(mockOnMentionsChange).toHaveBeenLastCalledWith(["u-1"]);
  });

  it("calls onMentionsChange with empty array when text has no mentions", async () => {
    const mockOnMentionsChange = vi.fn();
    const { textarea } = setup(defaultMembers, mockOnMentionsChange);
    await userEvent.type(textarea, "hello");
    expect(mockOnMentionsChange).toHaveBeenLastCalledWith([]);
  });

  it("detects multiple mentions in the same text", async () => {
    const mockOnMentionsChange = vi.fn();
    function Wrapper() {
      const [value, setValue] = useState("@Alice e ");
      return (
        <MentionTextarea
          value={value}
          onChange={setValue}
          onMentionsChange={mockOnMentionsChange}
          members={defaultMembers}
          placeholder="Escreva um comentário..."
        />
      );
    }
    render(<Wrapper />);
    const textarea = screen.getByPlaceholderText("Escreva um comentário...");
    await userEvent.type(textarea, "@Bob");
    expect(mockOnMentionsChange).toHaveBeenLastCalledWith(["u-1", "u-2"]);
  });

  it("closes dropdown when textarea loses focus", async () => {
    const { textarea } = setup();
    await userEvent.type(textarea, "@al");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.blur(textarea);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes dropdown when Escape is pressed", async () => {
    const { textarea } = setup();
    await userEvent.type(textarea, "@al");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

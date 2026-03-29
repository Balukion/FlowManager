import { useState } from "react";

export function usePagination() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<(string | undefined)[]>([]);

  function next(nextCursor: string) {
    setHistory((prev) => [...prev, cursor]);
    setCursor(nextCursor);
  }

  function previous() {
    setHistory((prev) => {
      const newHistory = [...prev];
      const prevCursor = newHistory.pop();
      setCursor(prevCursor);
      return newHistory;
    });
  }

  function reset() {
    setCursor(undefined);
    setHistory([]);
  }

  return {
    cursor,
    hasPrevious: history.length > 0,
    next,
    previous,
    reset,
  };
}

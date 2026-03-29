import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePagination } from "./use-pagination.js";

describe("usePagination", () => {
  it("should start with no cursor and no history", () => {
    const { result } = renderHook(() => usePagination());
    expect(result.current.cursor).toBeUndefined();
    expect(result.current.hasPrevious).toBe(false);
  });

  it("next() should update cursor to next_cursor", () => {
    const { result } = renderHook(() => usePagination());
    act(() => result.current.next("cursor-abc"));
    expect(result.current.cursor).toBe("cursor-abc");
  });

  it("previous() should go back to previous cursor", () => {
    const { result } = renderHook(() => usePagination());
    act(() => result.current.next("cursor-1"));
    act(() => result.current.next("cursor-2"));
    act(() => result.current.previous());
    expect(result.current.cursor).toBe("cursor-1");
  });

  it("reset() should return to first page", () => {
    const { result } = renderHook(() => usePagination());
    act(() => result.current.next("cursor-1"));
    act(() => result.current.next("cursor-2"));
    act(() => result.current.reset());
    expect(result.current.cursor).toBeUndefined();
    expect(result.current.hasPrevious).toBe(false);
  });

  it("hasPrevious should be true after navigating forward", () => {
    const { result } = renderHook(() => usePagination());
    act(() => result.current.next("cursor-1"));
    expect(result.current.hasPrevious).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "./use-debounce.js";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useDebounce", () => {
  it("should return the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 300));
    expect(result.current).toBe("initial");
  });

  it("should not update value before delay expires", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "first" } },
    );

    rerender({ value: "second" });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe("first");
  });

  it("should update value after delay expires", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "first" } },
    );

    rerender({ value: "second" });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("second");
  });

  it("should debounce multiple rapid changes and only apply the last", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "first" } },
    );

    rerender({ value: "second" });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: "third" });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("third");
  });
});

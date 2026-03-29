import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, ApiError } from "./api.client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("ApiError", () => {
  it("should store code, message and status", () => {
    const error = new ApiError("NOT_FOUND", "Resource not found", 404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("Resource not found");
    expect(error.status).toBe(404);
    expect(error.name).toBe("ApiError");
  });
});

describe("api.get", () => {
  it("should call fetch with GET method and return body", async () => {
    mockFetch.mockResolvedValue(makeResponse({ data: { id: "1" } }));
    const result = await api.get("/test");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/test"),
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(result).toEqual({ data: { id: "1" } });
  });

  it("should include Authorization header when token is provided", async () => {
    mockFetch.mockResolvedValue(makeResponse({ data: {} }));
    await api.get("/test", "my-token");
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers).toMatchObject({ Authorization: "Bearer my-token" });
  });

  it("should throw ApiError when response is not ok", async () => {
    mockFetch.mockResolvedValue(
      makeResponse({ error: { code: "UNAUTHORIZED", message: "Token inválido" } }, false, 401),
    );
    await expect(api.get("/protected")).rejects.toThrow(ApiError);
    await expect(api.get("/protected")).rejects.toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  });
});

describe("api.post", () => {
  it("should call fetch with POST method and JSON body", async () => {
    mockFetch.mockResolvedValue(makeResponse({ data: {} }));
    await api.post("/test", { name: "João" });
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify({ name: "João" }));
  });
});

describe("api.patch", () => {
  it("should call fetch with PATCH method", async () => {
    mockFetch.mockResolvedValue(makeResponse({ data: {} }));
    await api.patch("/test", { name: "Updated" });
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("PATCH");
  });
});

describe("api.delete", () => {
  it("should call fetch with DELETE method", async () => {
    mockFetch.mockResolvedValue(makeResponse({ data: {} }));
    await api.delete("/test");
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("DELETE");
  });
});

import { describe, expect, it } from "vitest";
import { bodySchema, paramsSchema, querySchema, strictObjectSchema } from "./api-docs.js";

describe("strictObjectSchema", () => {
  it("creates a strict object schema with additionalProperties disabled", () => {
    const schema = strictObjectSchema({
      required: ["name"],
      properties: {
        name: { type: "string", minLength: 1 },
      },
    });

    expect(schema).toEqual({
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", minLength: 1 },
      },
      additionalProperties: false,
    });
  });

  it("omits required when not provided", () => {
    const schema = strictObjectSchema({
      properties: {
        timezone: { type: "string" },
      },
    });

    expect(schema).toEqual({
      type: "object",
      properties: {
        timezone: { type: "string" },
      },
      additionalProperties: false,
    });
  });
});

describe("api docs wrappers", () => {
  it("wraps a body schema", () => {
    const schema = bodySchema({
      required: ["email"],
      properties: {
        email: { type: "string", format: "email" },
      },
    });

    expect(schema).toEqual({
      body: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
        },
        additionalProperties: false,
      },
    });
  });

  it("wraps params and query schemas", () => {
    expect(
      paramsSchema({
        required: ["id"],
        properties: {
          id: { type: "string" },
        },
      }),
    ).toEqual({
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
        },
        additionalProperties: false,
      },
    });

    expect(
      querySchema({
        properties: {
          cursor: { type: "string" },
          limit: { type: "integer", minimum: 1 },
        },
      }),
    ).toEqual({
      querystring: {
        type: "object",
        properties: {
          cursor: { type: "string" },
          limit: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  MAX_JSON_BODY_BYTES,
  bookmarkBodySchema,
  quoteIdParamSchema,
  readJsonObject,
  voteBodySchema,
} from "@/lib/request-body";

function post(body: string, contentType = "application/json") {
  return new Request("http://localhost/api/x", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  });
}

describe("readJsonObject", () => {
  it("returns the parsed object for a JSON request", async () => {
    await expect(readJsonObject(post('{"quoteId":7}'))).resolves.toEqual({
      quoteId: 7,
    });
  });

  it("accepts a charset suffix on the content type", async () => {
    await expect(
      readJsonObject(post('{"a":1}', "application/json; charset=utf-8")),
    ).resolves.toEqual({ a: 1 });
  });

  it("returns null for malformed JSON instead of throwing", async () => {
    await expect(readJsonObject(post("{not json"))).resolves.toBeNull();
  });

  it("returns null for JSON that is not a plain object", async () => {
    await expect(readJsonObject(post("null"))).resolves.toBeNull();
    await expect(readJsonObject(post("[1,2]"))).resolves.toBeNull();
    await expect(readJsonObject(post("42"))).resolves.toBeNull();
  });

  it("returns null for non-JSON content types, which HTML forms can send cross-site", async () => {
    await expect(
      readJsonObject(post('{"quoteId":7}', "text/plain")),
    ).resolves.toBeNull();
  });
});

describe("body size limit", () => {
  it("returns null for a body over the limit, even with a valid object", async () => {
    const big = JSON.stringify({ quoteId: 1, pad: "x".repeat(MAX_JSON_BODY_BYTES) });
    await expect(readJsonObject(post(big))).resolves.toBeNull();
  });

  it("rejects early when Content-Length declares an oversized body", async () => {
    const request = new Request("http://localhost/api/x", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": String(MAX_JSON_BODY_BYTES + 1),
      },
      body: "{}",
    });
    await expect(readJsonObject(request)).resolves.toBeNull();
  });
});

describe("API input schemas (Zod)", () => {
  it("accepts a valid vote and bookmark", () => {
    expect(voteBodySchema.safeParse({ quoteId: 8, value: -1 }).success).toBe(true);
    expect(bookmarkBodySchema.safeParse({ quoteId: 8 }).success).toBe(true);
  });

  it("rejects bad vote values and quote ids", () => {
    for (const body of [
      { quoteId: 8, value: 2 },
      { quoteId: "8", value: 1 },
      { quoteId: 0, value: 1 },
      { quoteId: 2_147_483_648, value: 1 },
      { quoteId: 1.5, value: 1 },
    ]) {
      expect(voteBodySchema.safeParse(body).success).toBe(false);
    }
  });

  it("parses a route id param strictly", () => {
    expect(quoteIdParamSchema.safeParse("8")).toMatchObject({ success: true, data: 8 });
    for (const id of ["0", "-1", "1e3", "08x", "99999999999", ""]) {
      expect(quoteIdParamSchema.safeParse(id).success).toBe(false);
    }
  });
});

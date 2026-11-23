import { describe, expect, it } from "vitest";
import { readJsonObject } from "@/lib/request-body";

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

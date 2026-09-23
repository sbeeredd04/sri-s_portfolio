import test from "node:test";
import assert from "node:assert/strict";
import { boundedJson } from "../app/lib/bounded-json.mjs";
const request = (text) =>
  new Request("https://example.com", { method: "POST", body: text });
test("accepts UTF-8 messages and rejects malformed JSON", async () => {
  assert.deepEqual(await boundedJson(request('{"message":"హాయ్ 👋"}'), 120), {
    status: 200,
    data: { message: "హాయ్ 👋" },
  });
  assert.equal((await boundedJson(request("{oops"), 100)).status, 400);
});
test("cancels an oversized chunked request without buffering the whole body", async () => {
  let cancelled = false;
  const body = new ReadableStream({
    pull(c) {
      c.enqueue(new Uint8Array(70));
    },
    cancel() {
      cancelled = true;
    },
  });
  const result = await boundedJson(
    new Request("https://example.com", {
      method: "POST",
      body,
      duplex: "half",
    }),
    100,
  );
  assert.equal(result.status, 413);
  assert.ok(cancelled);
});

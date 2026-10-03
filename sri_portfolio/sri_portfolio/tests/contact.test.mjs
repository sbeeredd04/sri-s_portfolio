import test from "node:test";
import assert from "node:assert/strict";
import {
  validateMessage,
  sameOrigin,
  mailDraft,
} from "../app/lib/contact-validation.mjs";
const valid = {
  name: "A visitor",
  email: "hello@example.com",
  message: "A new idea.",
};
test("contact accepts a bounded message and removes extra fields", () => {
  assert.deepEqual(validateMessage({ ...valid, secret: "ignored" }), valid);
  for (const change of [
    { name: "" },
    { email: "a\nb@example.com" },
    { message: "x".repeat(3001) },
    { website: "spam.example" },
    { name: "a".repeat(81) },
  ])
    assert.equal(validateMessage({ ...valid, ...change }), null);
});
test("contact requires the website origin, including scheme and port", () => {
  assert.equal(
    sameOrigin(
      new Request("https://site.test/api/contact", {
        headers: { origin: "https://site.test" },
      }),
    ),
    true,
  );
  for (const origin of [
    "https://evil.test",
    "http://site.test",
    "https://site.test:444",
    "null",
  ])
    assert.equal(
      sameOrigin(
        new Request("https://site.test/api/contact", { headers: { origin } }),
      ),
      false,
    );
});
test("email fallback carries the complete draft without allowing header injection", () => {
  const url = new URL(
    mailDraft({ ...valid, message: "Hello & ideas? #1\nThanks!" }),
  );
  assert.equal(url.pathname, "srisubspace@gmail.com");
  assert.equal(url.searchParams.get("subject"), "Hello from A visitor");
  assert.ok(
    url.searchParams.get("body").includes("Hello & ideas? #1\nThanks!"),
  );
});

import { submitContact, gmailDraft } from "../app/lib/contact-client.mjs";
import { savePrivate } from "../app/lib/private-inbox.mjs";

test("contact reports success only for an acknowledged save, and keeps failure reasons useful", async () => {
  const sent = await submitContact(valid, {
    request: async (_url, init) => {
      assert.equal(init.method, "POST");
      assert.deepEqual(JSON.parse(init.body), valid);
      return Response.json({ id: "test-receipt" }, { status: 201 });
    },
  });
  assert.equal(sent.id, "test-receipt");
  for (const response of [
    new Response("gateway failed", { status: 502 }),
    Response.json({}),
    Response.json({ error: "Wait before retrying" }, { status: 429 }),
  ])
    await assert.rejects(
      submitContact(valid, { request: async () => response }),
    );
  await assert.rejects(
    submitContact(valid, {
      request: async () => {
        throw new TypeError("Failed to fetch");
      },
    }),
    /connection failed/,
  );
  await assert.rejects(
    submitContact(valid, {
      signal: AbortSignal.abort(),
      request: async () => {
        throw new Error("abort");
      },
    }),
    /wasn’t confirmed/,
  );
  const gmail = new URL(gmailDraft(valid));
  assert.equal(gmail.origin, "https://mail.google.com");
  assert.equal(gmail.searchParams.get("to"), "srisubspace@gmail.com");
  assert.ok(gmail.searchParams.get("body").includes(valid.message));
});

test("failed private save releases its own reservation; duplicate send cannot release another request", async () => {
  const previous = [
    process.env.BLOB_READ_WRITE_TOKEN,
    process.env.INBOX_RATE_SECRET,
  ];
  process.env.BLOB_READ_WRITE_TOKEN = "test-only";
  process.env.INBOX_RATE_SECRET = "test-only";
  const request = new Request("https://site.test/api/contact");
  try {
    let writes = 0;
    const removed = [];
    const failed = await savePrivate("messages", valid, request, {
      put: async () => {
        if (++writes === 2) throw new Error("storage unavailable");
      },
      del: async (path) => removed.push(path),
    });
    assert.equal(failed.status, 503);
    assert.equal(removed.length, 1);
    assert.match(removed[0], /^limits\//);
    const duplicate = await savePrivate("messages", valid, request, {
      put: async () => {
        throw new Error("Vercel Blob: This blob already exists");
      },
      del: async () =>
        assert.fail("must not release someone else’s reservation"),
    });
    assert.equal(duplicate.status, 429);
    const success = await savePrivate("messages", valid, request, {
      put: async (_path, _body, options) =>
        assert.equal(options.access, "private"),
      del: async () => assert.fail("successful sends retain their rate limit"),
    });
    assert.equal(success.status, 201);
    assert.ok(success.id);
  } finally {
    for (const [i, key] of [
      "BLOB_READ_WRITE_TOKEN",
      "INBOX_RATE_SECRET",
    ].entries()) {
      if (previous[i] === undefined) delete process.env[key];
      else process.env[key] = previous[i];
    }
  }
});

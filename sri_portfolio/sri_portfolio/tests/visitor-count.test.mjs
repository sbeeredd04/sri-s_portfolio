import test from "node:test";
import assert from "node:assert/strict";
import { countingAvailable, parseCount } from "../app/lib/visitor-count.mjs";
import { runCommand } from "../app/lib/commands.mjs";

test("the counter blob is parsed defensively", () => {
  assert.equal(parseCount('{"count":41}'), 41);
  for (const bad of [
    "",
    "nope",
    '{"count":-3}',
    '{"count":1.5}',
    '{"count":"9"}',
    "null",
  ])
    assert.equal(parseCount(bad), 0, bad);
});

test("counting rests outside production", () => {
  const env = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "preview";
  process.env.BLOB_READ_WRITE_TOKEN ||= "x";
  process.env.INBOX_RATE_SECRET ||= "y";
  assert.equal(countingAvailable(), false);
  if (env === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = env;
});

test("the visitors command reports the count or says it is resting", () => {
  assert.match(
    runCommand("visitors", { visitors: 1204 }).text,
    /1,204 visitors/,
  );
  assert.match(runCommand("visitors").text, /resting/);
});

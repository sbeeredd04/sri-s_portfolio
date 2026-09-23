import test from "node:test";
import assert from "node:assert/strict";
import { supportsWebGL2 } from "../app/lib/webgl-support.mjs";
test("unsupported and blocked graphics use the non-WebGL path", () => {
  assert.equal(
    supportsWebGL2(() => ({ getContext: () => null })),
    false,
  );
  assert.equal(
    supportsWebGL2(() => ({
      getContext: () => {
        throw new Error("Disabled by browser");
      },
    })),
    false,
  );
});
test("a successful probe releases its temporary graphics context", () => {
  let released = false,
    requested;
  assert.equal(
    supportsWebGL2(() => ({
      getContext: (type) => {
        requested = type;
        return {
          getExtension: () => ({
            loseContext: () => {
              released = true;
            },
          }),
        };
      },
    })),
    true,
  );
  assert.equal(requested, "webgl2");
  assert.equal(released, true);
});

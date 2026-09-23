import test from "node:test";
import assert from "node:assert/strict";
import {
  matchesProject,
  projectId,
  linkedProjectId,
} from "../app/lib/project-library.mjs";

test("project search combines words across summaries, tools, and the full story", () => {
  const project = {
    name: "Image lab",
    description: "Inspect microscopy images.",
    stack: ["Python", "Django"],
    story: [
      { title: "Keep processing", body: "A CPU fallback supports clustering." },
    ],
  };
  assert.equal(matchesProject(project, "  PYTHON  fallback "), true);
  assert.equal(matchesProject(project, "images Django"), true);
  assert.equal(matchesProject(project, "Python music"), false);
  assert.equal(matchesProject(project, " "), true);
});

test("short technology queries match words rather than incidental letters", () => {
  assert.equal(
    matchesProject({ name: "A chair", description: "A detailed model" }, "AI"),
    false,
  );
  assert.equal(
    matchesProject({ name: "Assistant", category: "AI · tools" }, "AI"),
    true,
  );
  assert.equal(
    matchesProject({ name: "Music", category: "Music + ML" }, "ml"),
    true,
  );
});

test("project anchors preserve named IDs and reject unrelated or unsafe fragments", () => {
  assert.equal(
    projectId({ id: "gitcue", name: "GitCue / Auto-Git" }),
    "gitcue",
  );
  assert.equal(projectId({ name: "Beli Codes" }), "beli-codes");
  assert.equal(linkedProjectId("#project-gitcue"), "gitcue");
  for (const value of [
    "#work",
    "#project-",
    '#project-" onclick="x',
    "#project-%3Cscript%3E",
    "project-gitcue",
  ])
    assert.equal(linkedProjectId(value), null);
});

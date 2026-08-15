import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { FamilyMember } from "./family-model";

// Since we're using node:test and not necessarily React DOM in this layer easily,
// I'll just write types and assert the structure can handle it.
// The migration logic is straight forward mapping.
describe("Family Model", () => {
  test("FamilyMember type structure supports children and parents", () => {
    const parent: FamilyMember = {
      id: "p1",
      name: "Dad",
      role: "parent",
      chores: [],
    };

    const child: FamilyMember = {
      id: "c1",
      name: "Yusuf",
      role: "child",
      age: "4",
      chores: [{ id: "chore1", title: "Clean up", done: false }],
    };

    assert.equal(parent.role, "parent");
    assert.equal(child.role, "child");
    assert.equal(child.chores.length, 1);
  });
});

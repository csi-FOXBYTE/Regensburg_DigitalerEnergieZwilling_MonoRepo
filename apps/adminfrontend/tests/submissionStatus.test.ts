import assert from "node:assert/strict";
import { test } from "node:test";
import { toDetailStatus } from "../src/lib/submissionStatus.ts";

test("maps a superseded backend submission to the German UI status", () => {
  assert.equal(toDetailStatus("SUPERSEDED"), "ERSETZT");
});

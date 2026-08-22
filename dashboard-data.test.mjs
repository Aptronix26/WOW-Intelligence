import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
const match = html.match(/const D=(\{.*\});\nconst fmt=/);
assert.ok(match, "dashboard data block must be present");
const data = JSON.parse(match[1]);

const completed = {
  Mac: [1074, 897, 627, 467, 508, 651, 1005],
  iPhone: [2240, 2527, 2386, 2955, 3296, 2930, 4366],
  iPad: [795, 670, 552, 484, 428, 347, 412],
};

test("completed W1-W7 history remains unchanged", () => {
  for (const [lob, expected] of Object.entries(completed)) {
    assert.deepEqual(data.totals[lob].slice(0, 7), expected);
  }
  assert.equal(data.drivers.length, 6);
});

test("W8 live totals reconcile to the displayed model rows", () => {
  const expected = { Mac: 558, iPhone: 2112, iPad: 270 };
  for (const [lob, total] of Object.entries(expected)) {
    assert.equal(data.totals[lob][7], total);
    assert.equal(data.sub[lob].reduce((sum, row) => sum + row.weeks[7], 0), total);
  }
});

test("as-of metadata and live movements are consistent", () => {
  assert.equal(data.latest, "21 Aug 2026");
  assert.equal(data.w8Days, 6);
  assert.deepEqual(data.dates[7], { w: "W8", start: "16 Aug", end: "22 Aug" });
  for (const lob of Object.keys(completed)) {
    const totals = data.totals[lob];
    const expectedMove = (totals[7] / totals[6] - 1) * 100;
    assert.ok(Math.abs(data.moves[lob][7] - expectedMove) < 1e-10);
  }
});

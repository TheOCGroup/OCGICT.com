import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../../firestore.indexes.json", import.meta.url), "utf8")) as {
  indexes: Array<{ collectionGroup: string; queryScope: string; fields: Array<{ fieldPath: string; order: string }> }>;
};

describe("seller review Firestore deployment indexes", () => {
  for (const collection of ["g-leads-staging", "g-leads"]) {
    it(`declares both required ordered queries for ${collection}`, () => {
      const indexes = manifest.indexes.filter((i) => i.collectionGroup === collection && i.queryScope === "COLLECTION");
      for (const fields of [
        ["form:ASCENDING", "receivedAt:DESCENDING"],
        ["form:ASCENDING", "fields.role:ASCENDING", "receivedAt:DESCENDING"],
      ]) {
        expect(indexes.some((index) => JSON.stringify(index.fields.map((f) => `${f.fieldPath}:${f.order}`)) === JSON.stringify(fields))).toBe(true);
      }
    });
  }
});

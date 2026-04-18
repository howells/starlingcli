import { describe, expect, it } from "vitest";
import { filterFields } from "./output.ts";

describe("filterFields", () => {
  const items = [
    { id: "abc", name: "Tesco", amount: "£45.00", category: "GROCERIES" },
    { id: "def", name: "Shell", amount: "£60.00", category: "TRANSPORT" },
  ];

  it("returns all fields when no filter", () => {
    expect(filterFields(items, undefined)).toEqual(items);
  });

  it("filters to specified fields", () => {
    expect(filterFields(items, "name,amount")).toEqual([
      { name: "Tesco", amount: "£45.00" },
      { name: "Shell", amount: "£60.00" },
    ]);
  });

  it("ignores non-existent fields", () => {
    expect(filterFields(items, "id,nonexistent")).toEqual([
      { id: "abc" },
      { id: "def" },
    ]);
  });

  it("handles whitespace in field list", () => {
    expect(filterFields(items, "id , name")).toEqual([
      { id: "abc", name: "Tesco" },
      { id: "def", name: "Shell" },
    ]);
  });
});

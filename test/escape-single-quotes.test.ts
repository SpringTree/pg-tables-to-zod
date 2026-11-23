import { expect, test } from "bun:test";
import escapeSingleQuotes from "../src/converter/escape-single-quotes";

test("successfully escape single quotes", () => {
  expect(escapeSingleQuotes("A customer's account")).toBe("A customer\\'s account");
});

test("successfully convert a value when it is not a string", () => {
  expect(escapeSingleQuotes(42)).toBe("42");
  expect(escapeSingleQuotes(true)).toBe("true");
});

test("successfully return an empty string when there is no value", () => {
  expect(escapeSingleQuotes(null)).toBe("");
  expect(escapeSingleQuotes(undefined)).toBe("");
});

//

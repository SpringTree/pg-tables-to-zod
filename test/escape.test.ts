import { expect, test } from "bun:test";
import { escapeSingleQuotedString, escapeTemplateLiteral } from "../src/converter/escape";

test("successfully escape text for a template literal", () => {
  const text = "it's `quoted` with ${placeholder}, a \\ backslash, \\u0041 and a\nline break";
  expect(escapeTemplateLiteral(text)).toBe(
    "it's \\`quoted\\` with \\${placeholder}, a \\\\ backslash, \\\\u0041 and a\nline break",
  );
});

test("successfully keep text unchanged for a template literal when nothing needs escaping", () => {
  expect(escapeTemplateLiteral("A customer's account, $5 {total}")).toBe(
    "A customer's account, $5 {total}",
  );
});

test("successfully escape text for a single quoted string", () => {
  const text = "it's `quoted` with ${placeholder}, a \\ backslash and a\r\nline break";
  expect(escapeSingleQuotedString(text)).toBe(
    "it\\'s `quoted` with ${placeholder}, a \\\\ backslash and a\\r\\nline break",
  );
});

//

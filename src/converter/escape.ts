// Escapes database text (comments, defaults, enum values) for use in generated TypeScript code

// Escapes text for use inside a template literal: `...`
// - \  -> \\   so escape sequences in the text stay literal text (A stays A)
// - `  -> \`   so the text cannot end the literal
// - ${ -> \${  so the text cannot start a placeholder
//
export function escapeTemplateLiteral(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

// Escapes text for use inside a single quoted string: '...'
// - \  -> \\   so escape sequences in the text stay literal text
// - '  -> \'   so the text cannot end the string
// - line feed and carriage return -> \n and \r, a single quoted string cannot contain line breaks
//
export function escapeSingleQuotedString(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

//

import { join, resolve } from "node:path";
import type { EnumType } from "pg-structure";
import { camelCase, upperFirst } from "./camel-case.js";
import { escapeSingleQuotedString, escapeTemplateLiteral } from "./escape.js";
import { continuationIndent, GeneratedFile } from "./generated-file.js";

// Creates the shared types file with the reusable Zod schemas for PostgreSQL types.
// Enums are added to it by addEnum while the columns are converted
//
export function addSharedTypesFile({ outputFolder }: { outputFolder: string }) {
  const sharedTypesFile = new GeneratedFile(resolve(join(outputFolder, `pg-types.ts`)));

  // Add: import { z } from 'zod';
  sharedTypesFile.addNamedImport("z", "zod");

  // Declare the json type
  //
  const jsonTypeInitializer = `z.json().describe('Postgresql JSON type')`;

  // Add: export const JsonTypeSchema = ...
  // Add: export type TJsonType = z.infer<typeof JsonTypeSchema>;
  sharedTypesFile.addDeclaration("JsonTypeSchema", [
    `export const JsonTypeSchema = ${jsonTypeInitializer};`,
    `export type TJsonType = z.infer<typeof JsonTypeSchema>;`,
  ]);

  // Declare the postgresql interval type
  //
  const postgresqlIntervalInitializer = `z.union([
${continuationIndent}		z.number().describe('Interval duration in seconds'),
${continuationIndent}		z.string().describe('Descriptive interval duration i.e. 8 hours'),
${continuationIndent}		z
${continuationIndent}			.strictObject({
${continuationIndent}				years: z.number().optional(),
${continuationIndent}				months: z.number().optional(),
${continuationIndent}				days: z.number().optional(),
${continuationIndent}				hours: z.number().optional(),
${continuationIndent}				minutes: z.number().optional(),
${continuationIndent}				seconds: z.number().optional(),
${continuationIndent}				milliseconds: z.number().optional(),
${continuationIndent}			})
${continuationIndent}			.describe('Interval duration as an object'),
${continuationIndent}	])
${continuationIndent}	.describe('Postgresql interval type')`;

  // Add: export const PostgresqlIntervalSchema = ...
  // Add: export type TPostgresqlInterval = z.infer<typeof PostgresqlIntervalSchema>;
  sharedTypesFile.addDeclaration("PostgresqlIntervalSchema", [
    `export const PostgresqlIntervalSchema = ${postgresqlIntervalInitializer};`,
    `export type TPostgresqlInterval = z.infer<typeof PostgresqlIntervalSchema>;`,
  ]);

  return sharedTypesFile;
}

export function addEnum({
  columnType,
  description,
  enumType,
  sharedTypesFile,
  sourceFile,
}: {
  columnType: string;
  description?: string;
  enumType: EnumType;
  sharedTypesFile: GeneratedFile;
  sourceFile: GeneratedFile;
}) {
  const enumName = `${upperFirst(camelCase(columnType))}`;
  const schemaName = `${enumName}Schema`;

  const values = enumType.values;
  const isNumeric = !!enumType.numericType;
  let enumInitializer = isNumeric
    ? `z.literal([${Array.from(values.keys())
        .map((value) => `'${value}'`)
        .join(",")}])`
    : `z.enum([${values.map((value) => `'${escapeSingleQuotedString(value)}'`).join(",")}])`;
  if (description) {
    enumInitializer += `.describe(\`${escapeTemplateLiteral(description)}\`)`;
  }

  // Only added to the shared types file the first time the enum is used
  // Add: export const ${enumName}Schema = ...
  // Add: export type E${enumName} = z.infer<typeof ${enumName}Schema>;
  sharedTypesFile.addDeclaration(schemaName, [
    `export const ${schemaName} = ${enumInitializer};`,
    `export type E${enumName} = z.infer<typeof ${schemaName}>;`,
  ]);

  // Import the enum schema into the source file, only added the first time
  //
  sourceFile.addNamedImport(schemaName, sourceFile.getModuleSpecifierTo(sharedTypesFile));

  return schemaName;
}

//

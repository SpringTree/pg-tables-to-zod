import { join, resolve } from "node:path";
import type { EnumType } from "pg-structure";
import { camelCase, upperFirst } from "./camel-case.js";
import { escapeSingleQuotedString, escapeTemplateLiteral } from "./escape.js";
import { GeneratedFile } from "./generated-file.js";

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
  const postgresqlIntervalInitializer = `z
	.union([
		z.number().describe('Interval duration in seconds'),
		z.string().describe('Descriptive interval duration i.e. 8 hours'),
		z
			.strictObject({
				years: z.number().optional(),
				months: z.number().optional(),
				days: z.number().optional(),
				hours: z.number().optional(),
				minutes: z.number().optional(),
				seconds: z.number().optional(),
				milliseconds: z.number().optional(),
			})
			.describe('Interval duration as an object'),
	])
	.describe('Postgresql interval type')`;

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

  // PostgreSQL enum values are always text labels
  //
  const values = enumType.values;
  let enumInitializer = `z.enum([${values.map((value) => `'${escapeSingleQuotedString(value)}'`).join(",")}])`;
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

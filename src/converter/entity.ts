import { join, resolve } from "node:path";
import type { Entity } from "pg-structure";
import { camelCase, upperFirst } from "./camel-case.js";
import { convertColumn } from "./column.js";
import { escapeTemplateLiteral } from "./escape.js";
import { GeneratedFile } from "./generated-file.js";

// Helper method to convert a postgresql table to a Zod schema file
// which is output either to files or to stdout
//
export function convertEntity({
  strict,
  defaultDescription,
  outputFolder,
  schemaName,
  entity,
  sharedTypesFile,
}: {
  strict: boolean;
  defaultDescription?: string;
  outputFolder: string;
  schemaName: string;
  entity: Entity;
  sharedTypesFile: GeneratedFile;
}) {
  const entityName = entity.name;
  const variableName = camelCase(entityName);
  const columns = entity.columns;

  // Each entity schema will end up in its own file
  //
  const folderName = join(outputFolder, schemaName);
  const fileName = join(folderName, `${entityName}.ts`);

  const sourceFile = new GeneratedFile(resolve(fileName));

  // Add: import { z } from 'zod';
  sourceFile.addNamedImport("z", "zod");

  // Check if any of the columns are using the PostgresqlInterval type
  // If so, import it from the shared types file
  //
  const usesPostgresqlInterval = columns.some((column) => column.type.name === "interval");
  if (usesPostgresqlInterval) {
    sourceFile.addNamedImport(
      "PostgresqlIntervalSchema",
      sourceFile.getModuleSpecifierTo(sharedTypesFile),
    );
  }

  const columnSchemaCode: string[] = [];
  for (const column of columns) {
    columnSchemaCode.push(
      convertColumn({
        column,
        defaultDescription,
        sharedTypesFile,
        sourceFile,
      }),
    );
  }

  // Add the zod schema constant
  //
  const schemaInitializer = `z
	.${strict ? "strictObject" : "object"}({
		${columnSchemaCode.join(",\n\t\t")}
	})
	.describe(\`${escapeTemplateLiteral(entity.comment || defaultDescription || `No description available for ${entity.name}`)}\`)`;

  // Add: const entitySchema = ...
  // Add: export type TEntity = z.infer<typeof entitySchema>;
  // Add: export default entitySchema;
  sourceFile.addDeclaration(`${variableName}Schema`, [
    `const ${variableName}Schema = ${schemaInitializer};`,
    `export type T${upperFirst(variableName)} = z.infer<typeof ${variableName}Schema>;`,
    `export default ${variableName}Schema;`,
  ]);

  return sourceFile;
}

//

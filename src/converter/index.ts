import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, sep } from "node:path";
import pgStructureImport, { type Schema } from "pg-structure";
import { checkConfiguration } from "../config/check.js";
import type { TConfiguration } from "../config/index.js";
import { convertEntity } from "./entity.js";
import type { GeneratedFile } from "./generated-file.js";
import { addSharedTypesFile } from "./shared-types.js";

// pg-structure is CommonJS marked as transpiled ESM (__esModule). Importing its default export
// gives the function under Bun, but the whole module object under Node.js, with the function at .default
//
const pgStructure =
  (pgStructureImport as unknown as { default?: typeof pgStructureImport }).default ??
  pgStructureImport;

// Compares like "a".localeCompare("B"): case-insensitive, upper case first when only the case differs
//
function compareNames(name: string, otherName: string) {
  return name.localeCompare(otherName, "en-us-u-kf-upper");
}

// Orders the files as the output has always been ordered: the shared types file in the output
// folder first, then a folder per schema sorted by name, each with its files sorted by name
//
function compareGeneratedFiles(file: GeneratedFile, otherFile: GeneratedFile) {
  const folder = dirname(file.filePath);
  const otherFolder = dirname(otherFile.filePath);
  return (
    folder.split(sep).length - otherFolder.split(sep).length ||
    compareNames(basename(folder), basename(otherFolder)) ||
    compareNames(basename(file.filePath), basename(otherFile.filePath))
  );
}

export interface IOutputZodSchema {
  // Output file path and name
  path: string;
  // The output TypeScript code for the Zod schema
  schema: string;
}

// Using console.warn on purpose here so that output to stdout can be captured
// without logging information messages
//
export async function convert(configuration: TConfiguration): Promise<IOutputZodSchema[]> {
  checkConfiguration(configuration);

  console.warn("Connecting to database...");
  const dbSchemas = configuration.input?.schemas || ["public"];
  const dbConfig = configuration.pg;
  const pgStructureDatabase = await pgStructure(
    {
      database: dbConfig.database,
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    },
    {
      includeSchemas: dbSchemas,
      includeSystemSchemas: true,
    },
  );

  const includedEntities = configuration.input?.include || [];
  const excludedEntities = configuration.input?.exclude || [];

  const outputFolder = configuration.output?.outDir || "dist/validators";
  const defaultDescription = configuration.output?.defaultDescription;
  const strict = configuration.output?.strict !== false;

  // Add and prepare the shared PostgreSQL types and enums file
  // This file will contain reusable Zod schemas for PostgreSQL types
  // such as the interval type and any enums found in the database
  //
  const sharedTypesFile = addSharedTypesFile({ outputFolder });
  const files = [sharedTypesFile];

  // Iterate all the schemas
  //
  for (const dbSchema of dbSchemas) {
    console.warn(`Processing schema ${dbSchema}`);
    const schema = pgStructureDatabase.get(dbSchema) as Schema;
    const schemaName = schema.name;

    // Process all the tables in the schema
    //
    for (const table of schema.tables) {
      const tableName = table.name;

      // Check if the entity is included and/or excluded
      //
      if (
        excludedEntities.indexOf(`${schemaName}.${tableName}`) === -1 &&
        (includedEntities.length === 0 ||
          includedEntities.indexOf(`${schemaName}.${tableName}`) !== -1)
      ) {
        console.warn(`Processing table ${schemaName}/${tableName}`);
        files.push(
          convertEntity({
            strict,
            defaultDescription,
            outputFolder,
            schemaName,
            entity: table,
            sharedTypesFile,
          }),
        );
      } else {
        console.warn(`Skipping excluded table ${tableName}`);
      }
    }

    // Process all the views in the schema
    //
    for (const view of schema.views) {
      const viewName = view.name;

      // Check if the entity is included and/or excluded
      //
      if (
        excludedEntities.indexOf(`${schemaName}.${viewName}`) === -1 &&
        (includedEntities.length === 0 ||
          includedEntities.indexOf(`${schemaName}.${viewName}`) !== -1)
      ) {
        console.warn(`Processing view ${schemaName}/${viewName}`);
        files.push(
          convertEntity({
            strict,
            defaultDescription,
            outputFolder,
            schemaName,
            entity: view,
            sharedTypesFile,
          }),
        );
      }
    }

    // Process all the materialized views in the schema
    //
    for (const view of schema.materializedViews) {
      const viewName = view.name;

      // Check if the entity is included and/or excluded
      //
      if (
        excludedEntities.indexOf(`${schemaName}.${viewName}`) === -1 &&
        (includedEntities.length === 0 ||
          includedEntities.indexOf(`${schemaName}.${viewName}`) !== -1)
      ) {
        console.warn(`Processing materialized view ${schemaName}/${viewName}`);
        files.push(
          convertEntity({
            strict,
            defaultDescription,
            outputFolder,
            schemaName,
            entity: view,
            sharedTypesFile,
          }),
        );
      }
    }
  }

  const outputSchemas = files.sort(compareGeneratedFiles).map((file) => ({
    path: file.filePath,
    schema: file.getFullText(),
  }));

  // Saving to disk if an output folder is specified in the configuration options
  //
  if (configuration.output?.outDir) {
    console.warn(`Outputting files to ${outputFolder}`);
    for (const outputSchema of outputSchemas) {
      await mkdir(dirname(outputSchema.path), { recursive: true });
      await writeFile(outputSchema.path, outputSchema.schema);
    }
  }
  return outputSchemas;
}

import pgStructure, { type Schema } from 'pg-structure';
import { Project } from 'ts-morph';
import { checkConfiguration } from '../config/check.js';
import type { TConfiguration } from '../config/index.js';
import { convertEntity } from './entity.js';

export interface IOutputZodSchema {
	// Output file path and name
	path: string;
	// The output TypeScript code for the Zod schema
	schema: string;
}

// Using console.warn on purpose here so that output to stdout can be captured
// without logging information messages
//
export async function convert(
	configuration: TConfiguration,
): Promise<IOutputZodSchema[]> {
	checkConfiguration(configuration);

	console.warn('Connecting to database...');
	const dbSchemas = configuration.input?.schemas || ['public'];
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

	const outputFolder = configuration.output?.outDir;
	const defaultDescription = configuration.output?.defaultDescription;
	const strict = configuration.output?.strict !== false;
	const project = new Project({
		compilerOptions: {
			declaration: false,
			outDir: outputFolder || 'dist/validators',
		},
	});

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
				excludedEntities.indexOf(tableName) === -1 &&
				(includedEntities.length === 0 ||
					includedEntities.indexOf(tableName) !== -1)
			) {
				console.warn(`Processing table ${tableName}`);
				convertEntity({
					project,
					strict,
					defaultDescription,
					outputFolder,
					schemaName,
					entity: table,
				});
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
				excludedEntities.indexOf(viewName) === -1 &&
				(includedEntities.length === 0 ||
					includedEntities.indexOf(viewName) !== -1)
			) {
				console.warn(`Processing view ${viewName}`);
				convertEntity({
					project,
					strict,
					defaultDescription,
					outputFolder,
					schemaName,
					entity: view,
				});
			}
		}

		// Process all the materialized views in the schema
		//
		for (const view of schema.materializedViews) {
			const viewName = view.name;

			// Check if the entity is included and/or excluded
			//
			if (
				excludedEntities.indexOf(viewName) === -1 &&
				(includedEntities.length === 0 ||
					includedEntities.indexOf(viewName) !== -1)
			) {
				console.warn(`Processing materialized view ${viewName}`);
				convertEntity({
					project,
					strict,
					defaultDescription,
					outputFolder,
					schemaName,
					entity: view,
				});
			}
		}
	}

	// Output the project to memory to return it
	// Also saving to disk if an output folder is specified
	//
	const files = project.getSourceFiles();
	if (outputFolder) {
		console.warn(`Outputting files to ${outputFolder}`);
		await project.save();
	}
	return files.map((file) => ({
		path: file.getFilePath(),
		schema: file.getFullText(),
	}));
}

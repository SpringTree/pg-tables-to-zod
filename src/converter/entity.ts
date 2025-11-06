import { join } from 'node:path';
import { camelCase, upperFirst } from 'lodash-es';
import type { Entity } from 'pg-structure';
import {
	type Project,
	type SourceFile,
	VariableDeclarationKind,
} from 'ts-morph';
import { convertColumn } from './column.js';
import escapeSingleQuotes from './escape-single-quotes.js';

// Helper method to convert a postgresql table to a Zod schema
// Which will be added to the ts-morph project to be output either
// to files or to stdout
//
export function convertEntity({
	project,
	strict,
	defaultDescription,
	outputFolder,
	schemaName,
	entity,
	sharedTypesFile,
}: {
	project: Project;
	strict: boolean;
	defaultDescription?: string;
	outputFolder: string;
	schemaName: string;
	entity: Entity;
	sharedTypesFile: SourceFile;
}) {
	const entityName = entity.name;
	const variableName = camelCase(entityName);
	const columns = entity.columns;

	// Each entity schema will end up in its own file
	//
	const folderName = join(outputFolder, schemaName);
	const fileName = join(folderName, `${entityName}.ts`);

	const sourceFile = project.createSourceFile(fileName);

	// Add: import { z } from 'zod';
	sourceFile.addImportDeclaration({
		moduleSpecifier: 'zod',
		namedImports: ['z'],
	});

	// Check if any of the columns are using the PostgresqlInterval type
	// If so, import it from the shared types file
	//
	const usesPostgresqlInterval = columns.some(
		(column) => column.type.name === 'interval',
	);
	if (usesPostgresqlInterval) {
		sourceFile.addImportDeclaration({
			moduleSpecifier: sharedTypesFile.getFilePath(),
			namedImports: ['PostgresqlIntervalSchema'],
		});
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
	.${strict ? 'strictObject' : 'object'}({
		${columnSchemaCode.join(',\n		')}
	})
	.describe('${escapeSingleQuotes(entity.comment || defaultDescription || `No description available for ${entity.name}`)}')`;

	sourceFile.addVariableStatement({
		declarationKind: VariableDeclarationKind.Const,
		declarations: [
			{
				name: `${variableName}Schema`,
				initializer: schemaInitializer,
			},
		],
	});

	// Add: export type TEntity = z.infer<typeof entitySchema>;
	sourceFile.addTypeAlias({
		name: `T${upperFirst(variableName)}`,
		isExported: true,
		type: `z.infer<typeof ${variableName}Schema>`,
	});

	// Add: export default entitySchema;
	sourceFile.addExportAssignment({
		expression: `${variableName}Schema`,
		isExportEquals: false,
	});

	return sourceFile;
}

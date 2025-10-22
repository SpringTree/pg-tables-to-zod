import { join } from 'node:path';
import type { Entity } from 'pg-structure';
import { type Project, VariableDeclarationKind } from 'ts-morph';
import { convertColumn } from './column.js';

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
}: {
	project: Project;
	strict: boolean;
	defaultDescription?: string;
	outputFolder?: string;
	schemaName: string;
	entity: Entity;
}) {
	const entityName = entity.name;
	const baseName = entityName.replace(`${schemaName}_`, '');

	// Each entity schema will end up in its own file
	//
	const folderName = join(outputFolder ?? '.', schemaName);
	const fileName = join(folderName, `${baseName}.ts`);

	const sourceFile = project.createSourceFile(fileName);

	// Add: import { z } from 'zod';
	sourceFile.addImportDeclaration({
		moduleSpecifier: 'zod',
		namedImports: ['z'],
	});

	const columns = entity.columns;
	const columnSchemaCode: string[] = [];
	for (const column of columns) {
		columnSchemaCode.push(
			convertColumn({
				column,
				defaultDescription,
			}),
		);
	}

	// Add the zod schema constant
	//
	const schemaInitializer = `z
	.object({
		${columnSchemaCode.join(',\n')}
	})
	${strict ? '.strict()' : ''}
	.describe('${entity.comment || defaultDescription || `No description available for ${entity.name}`}');`;

	sourceFile
		.addVariableStatement({
			declarationKind: VariableDeclarationKind.Const,
			declarations: [
				{
					name: `${baseName}Schema`,
					initializer: schemaInitializer,
				},
			],
		})
		.setIsDefaultExport(true);

	// Add: export type TEntity = z.infer<typeof entitySchema>;
	sourceFile.addTypeAlias({
		name: `T${baseName}`,
		isExported: true,
		type: `z.infer<typeof ${baseName}Schema>`,
	});

	return sourceFile;
}

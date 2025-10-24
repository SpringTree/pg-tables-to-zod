import { join } from 'node:path';
import { camelCase, upperFirst } from 'lodash-es';
import type { EnumType } from 'pg-structure';
import {
	type Project,
	type SourceFile,
	VariableDeclarationKind,
} from 'ts-morph';

export function addSharedTypesFile({
	project,
	outputFolder,
}: {
	project: Project;
	outputFolder: string;
}) {
	const fileName = join(outputFolder, `pg-types.ts`);
	const sourceFile = project.createSourceFile(fileName);

	// Add: import { z } from 'zod';
	sourceFile.addImportDeclaration({
		moduleSpecifier: 'zod',
		namedImports: ['z'],
	});

	// Declare the postgresql interval type
	//
	const postgresqlIntervalInitializer = `z.union([
		z.number().describe('Interval duration in seconds'),
		z.string().describe('Descriptive interval duration i.e. 8 hours'),
		z
			.object({
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
	.describe('Postgresql interval type');`;

	// Add: export const PostgresqlIntervalSchema = ...
	sourceFile.addVariableStatement({
		declarationKind: VariableDeclarationKind.Const,
		declarations: [
			{
				name: `PostgresqlIntervalSchema`,
				initializer: postgresqlIntervalInitializer,
			},
		],
		isExported: true,
	});

	// Add: export type TPostgresqlInterval = z.infer<typeof PostgresqlIntervalSchema>;
	sourceFile.addTypeAlias({
		name: `TPostgresqlInterval`,
		isExported: true,
		type: `z.infer<typeof PostgresqlIntervalSchema>`,
	});

	return sourceFile;
}

export function addEnum({
	columnType,
	enumType,
	sharedTypesFile,
	sourceFile,
}: {
	columnType: string;
	enumType: EnumType;
	sharedTypesFile: SourceFile;
	sourceFile: SourceFile;
}) {
	const enumName = `${upperFirst(camelCase(columnType))}`;
	const existingVariables = sharedTypesFile.getVariableDeclarations();
	const schemaName = `${enumName}Schema`;

	// Only add the enum if it doesn't already exist in the shared types file
	//
	if (
		!existingVariables.some((variable) => variable.getName() === schemaName)
	) {
		const values = enumType.values;
		const isNumeric = !!enumType.numericType;
		const enumInitializer = isNumeric
			? `z.literal([${Array.from(values.keys()).map((value) => `'${value}'`)}])`
			: `z.enum([${values.map((value) => `'${value}'`)}])`;

		// Add: export const PostgresqlIntervalSchema = ...
		sharedTypesFile.addVariableStatement({
			declarationKind: VariableDeclarationKind.Const,
			declarations: [
				{
					name: schemaName,
					initializer: enumInitializer,
				},
			],
			isExported: true,
		});

		// Add: export type E${enumName} = z.infer<typeof ${enumName}Schema>;
		sharedTypesFile.addTypeAlias({
			name: `E${enumName}`,
			isExported: true,
			type: `z.infer<typeof ${schemaName}>`,
		});
	}

	// Import the enum schema into the source file if not already imported
	//
	const existingImports = sourceFile.getImportDeclarations();
	const isAlreadyImported = existingImports.some((importDecl) => {
		const namedImports = importDecl.getNamedImports();
		return namedImports.some(
			(namedImport) => namedImport.getName() === schemaName,
		);
	});
	if (!isAlreadyImported) {
		sourceFile.addImportDeclaration({
			moduleSpecifier: sourceFile
				.getRelativePathTo(sharedTypesFile)
				.replace(/\.ts$/, '.js'),
			namedImports: [schemaName],
		});
	}

	return schemaName;
}

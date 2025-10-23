import { type Column, EnumType } from 'pg-structure';
import type { SourceFile } from 'ts-morph';
import escapeSingleQuotes from './escape-single-quotes.js';
import { addEnum } from './shared-types.js';

/**
 * Helper method to convert a postgresql column to a Zod schema object property.
 * This will be used in the convertEntity method to build the full entity schema.
 * The output will be a string with the TypeScript code
 */
export function convertColumn({
	column,
	defaultDescription,
	sharedTypesFile,
}: {
	column: Column;
	defaultDescription?: string;
	sharedTypesFile: SourceFile;
}): string {
	const columnName = column.name;
	const columnType = column.type.name;
	const isArray = column.arrayDimension > 0;
	const enumType =
		column.type instanceof EnumType ? (column.type as EnumType) : undefined;
	let description = `${escapeSingleQuotes(column.comment) || defaultDescription || `No description available for column ${columnName}`}. Database type: ${columnType}. Default value: ${escapeSingleQuotes(column.default)}`;
	if (enumType) {
		const values = enumType.values;
		description += ` Enumeration values: ${values.join(', ')}`;
	}

	let typeSchema: string = '';
	switch (columnType) {
		case 'bit':
		case 'bit varying':
		case 'varbit':
		case 'character':
		case 'character varying':
		case 'text':
		case 'bytea':
			{
				typeSchema = `z.string()`;
			}
			break;

		case 'uuid':
			{
				typeSchema = `z.uuid()`;
			}
			break;

		case 'date':
			{
				typeSchema = `z.iso.date()`;
			}
			break;

		case 'time with time zone':
		case 'time without time zone':
			{
				typeSchema = `z.iso.time()`;
			}
			break;

		case 'timestamp with time zone':
		case 'timestamp without time zone':
		case 'timestamp':
			{
				typeSchema = `z.iso.datetime()`;
			}
			break;

		case 'boolean':
			{
				typeSchema = `z.boolean()`;
			}
			break;

		case 'int':
		case 'integer':
		case 'smallint':
			{
				typeSchema = `z.int()`;
			}
			break;

		case 'bigint':
		case 'decimal':
		case 'double precision':
		case 'float8':
		case 'numeric':
		case 'real':
			{
				typeSchema = `z.number()`;
			}
			break;

		case 'json':
		case 'jsonb':
			{
				typeSchema = `z.json()`;
			}
			break;

		case 'interval':
			{
				// Use the reusable PostgresqlIntervalSchema from the shared types file
				// The convertEntity method should ensure that the shared types file is imported
				// if any columns are using the interval type
				//
				typeSchema = `PostgresqlIntervalSchema`;
			}
			break;

		default:
			{
				if (enumType) {
					addEnum({ sharedTypesFile, columnType, enumType });
				} else {
					console.warn(
						`Unsupported column type: ${columnType}. Defaulting to any`,
					);
					typeSchema = `z.any()`;
				}
			}
			break;
	}

	if (isArray) {
		typeSchema = `z.array(${typeSchema})`;
	}
	if (column.length) {
		typeSchema += `.max(${column.length})`;
	}
	if (defaultDescription) {
		typeSchema += `.describe('${description}')`;
	}

	// If the column is nullable or has a default value, make it optional
	//
	if (!column.notNull || column.default) {
		typeSchema += '.optional()';
	}

	return `${columnName}: ${typeSchema}`;
}

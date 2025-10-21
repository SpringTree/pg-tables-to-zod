import { z } from 'zod'

const outputConfigurationSchema = z
	.object({
		outDir: z
			.string()
			.optional()
			.describe(
				'The output folder to write all the schema files to. If omitted all the schemas will be output to STDOUT. When converting a single schema to STDOUT you will likely want to set the unwrap option',
			),
		unwrap: z
			.boolean()
			.optional()
			.describe(
				'If a single schema is converted and output to STDOUT you can enable this flag to unwrap the schema from the normally output array',
			),
		strict: z
			.boolean()
			.optional()
			.describe(
				'Sets the zod schemas to be strict and not accept unknown properties. Defaults to true',
			),
		defaultDescription: z
			.string()
			.optional()
			.describe(
				'The default description to set for structure items that lack one. Defaults to the current date and time of the import',
			),
	})
	.strict()
	.describe('Database setting configuration')

export type TOutputConfiguration = z.infer<typeof outputConfigurationSchema>
export default outputConfigurationSchema

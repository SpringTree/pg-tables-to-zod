import { z } from 'zod';

const inputConfigurationSchema = z
	.object({
		schemas: z
			.array(z.string())
			.optional()
			.describe("The schemas to convert. Defaults to [ 'public' ]"),
		include: z
			.array(z.string())
			.optional()
			.describe(
				'List of structure objects to include in the conversion. Defaults to all found.',
			),
		exclude: z
			.array(z.string())
			.optional()
			.describe(
				'List of structure objects to exclude in the conversion. Defaults to none.',
			),
	})
	.strict()
	.describe('Database setting configuration');

export type TInputConfiguration = z.infer<typeof inputConfigurationSchema>;
export default inputConfigurationSchema;

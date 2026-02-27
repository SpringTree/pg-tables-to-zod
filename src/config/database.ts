import { z } from 'zod';

const databaseConfigSchema = z
	.object({
		host: z.string().min(2).max(100).describe('Database host'),
		database: z.string().min(2).max(100).describe('Database name'),
		port: z
			.number()
			.min(1)
			.max(65535)
			.optional()
			.describe('Database port. Defaults to 5432'),
		user: z.string().min(2).max(100).describe('Database user'),
		password: z
			.string()
			.min(6)
			.max(100)
			.optional()
			.describe('Database password'),
	})
	.strict()
	.describe('Database setting configuration');

export type TDatabaseConfiguration = z.infer<typeof databaseConfigSchema>;
export default databaseConfigSchema;

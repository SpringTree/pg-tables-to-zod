import { z } from 'zod';
import pg from './database.js';
import input from './input.js';
import output from './output.js';

const configurationSchema = z
	.object({
		pg,
		input,
		output,
	})
	.strict()
	.describe('Overall configuration schema');

export type TConfiguration = z.infer<typeof configurationSchema>;
export default configurationSchema;

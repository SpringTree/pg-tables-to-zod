import { z } from 'zod'
import pg from './database'
import input from './input'
import output from './output'

const configurationSchema = z
	.object({
		pg,
		input,
		output,
	})
	.strict()
	.describe('Overall configuration schema')

export type TConfiguration = z.infer<typeof configurationSchema>
export default configurationSchema

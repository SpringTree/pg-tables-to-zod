import configurationSchema, { type TConfiguration } from './index.js';

// Check the configuration using Zod and throw an error if invalid
//
export function checkConfiguration(configuration: TConfiguration) {
	configurationSchema.parse(configuration);
}

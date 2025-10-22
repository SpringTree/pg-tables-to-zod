import { expect, test } from 'bun:test';
import { configurationSchema, type TConfiguration } from '../src';

const exampleConfig: TConfiguration = {
	pg: {
		host: 'localhost',
		database: 'mydb',
		user: 'postgres',
		password: 'secret',
	},
	input: {
		schemas: ['public', 'stuff'],
		exclude: ['not_this_table'],
		include: [],
	},
	output: {
		strict: true,
		defaultDescription: 'Missing description',
		outDir: '',
		unwrap: false,
	},
};

test('validate valid configuration', () => {
	try {
		const parsedConfig = configurationSchema.parse(exampleConfig);
		expect(parsedConfig).toEqual(exampleConfig);
	} catch (error) {
		expect(error).toBeUndefined();
	}
});

test('incomplete configuration should fail', () => {
	try {
		const incompleteConfig = structuredClone(exampleConfig);
		delete (incompleteConfig as Partial<TConfiguration>).pg;
		const parsedConfig = configurationSchema.parse(incompleteConfig);
		expect(parsedConfig).toBeUndefined();
	} catch (error) {
		expect(error).toBeDefined();
	}
});

test('invalid configuration should fail', () => {
	try {
		const invalidConfig = structuredClone(exampleConfig);
		invalidConfig.pg.port = -1;
		// biome-ignore lint/suspicious/noExplicitAny: needed for test to fail
		(invalidConfig.pg.database as any) = false;
		const parsedConfig = configurationSchema.parse(invalidConfig);
		expect(parsedConfig).toBeUndefined();
	} catch (error) {
		expect(error).toBeDefined();
	}
});

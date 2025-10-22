import { program } from 'commander';
import { merge } from 'lodash-es';
import prompts from 'prompts';
import { z } from 'zod';
import { version } from '../package.json';
import { checkConfiguration } from './config/check.js';
import type { TConfiguration } from './config/index.js';
import { readConfigFile } from './config/read-file.js';
import { convert } from './converter/index.js';

// Collect command-line options and arguments
//
program
	.version(version)
	.usage('[options]')
	.option(
		'-c, --config <value>',
		'Path to configuration file. Additional parameters override config values',
	)
	.option('--pg-host <value>', 'The postgresql host to connect to')
	.option(
		'--pg-port <n>',
		'The postgresql host to connect to. Defaults to 5432',
	)
	.option('--pg-database <value>', 'The postgresql database to connect to')
	.option('--pg-user <value>', 'The postgresql user to login with')
	.option('--pg-password <value>', 'The postgresql password to login with')
	.option('--pg-schema <value>', 'Comma separated list of schemas to convert')
	.option(
		'-o, --out [file]',
		'Output folder. Default output is to STDOUT. A sub-folder will be created per schema',
	)
	.option(
		'-s, --strict <value>',
		'Allow additional properties on final schema. Default: true',
	)
	.option(
		'-t, --include-tables <value>',
		'Comma separated list of tables to process. Default is all tables found',
	)
	.option(
		'-e, --exclude-tables <value>',
		'Comma separated list of tables to exclude. Default is to not exclude any',
	)
	.option('-u, --unwrap', 'Unwraps the schema if only 1 is returned')
	.option('-d, --desc <value>', 'Default description when database lacks one.')

	.parse(process.argv);

program.parse();

const options = program.opts();

if (Object.keys(options).length === 0) {
	program.help();
}

const {
	config,
	pgHost,
	pgPort,
	pgDatabase,
	pgUser,
	pgPassword,
	pgSchema,
	out,
	strict,
	includeTables,
	excludeTables,
	unwrap,
	desc,
} = options;

let configuration: TConfiguration = {
	pg: {
		host: pgHost,
		database: pgDatabase,
		port: pgPort ?? 5432,
		user: pgUser,
		password: pgPassword,
	},
	input: {
		schemas: pgSchema ? pgSchema.split(',') : undefined,
		include: includeTables ? includeTables.split(',') : undefined,
		exclude: excludeTables ? excludeTables.split(',') : undefined,
	},
	output: {
		outDir: out,
		unwrap: unwrap,
		strict: strict,
		defaultDescription: desc,
	},
};
if (config) {
	try {
		// Apply the configuration file values, overridden by CLI options
		//
		const configFromFile = await readConfigFile(config);
		configuration = merge(configuration, configFromFile, configuration);
	} catch (error) {
		console.error(`Failed to read configuration file at ${config}:`, error);
		process.exit(1);
	}
}

// If password is not provided, prompt for it
//
if (!configuration.pg.password) {
	const response = await prompts({
		type: 'password',
		name: 'password',
		message: 'Password?',
	});

	configuration.pg.password = response.password;
}

// Check the configuration using Zod
//
try {
	checkConfiguration(configuration);
} catch (error) {
	if (error instanceof z.ZodError) {
		console.error('Configuration has issues:', error.issues);
	} else {
		console.error('Configuration is invalid:', error);
	}
	process.exit(1);
}

// Generate the schemas either to disk or memory depending on the configuration settings
//
try {
	const outputSchemas = await convert(configuration);
	const outputFolder = configuration.output?.outDir;
	const unwrap = configuration.output?.unwrap ?? false;

	if (!outputFolder) {
		if (unwrap && outputSchemas.length === 1) {
			console.log(outputSchemas[0]);
		} else if (outputSchemas.length > 0) {
			console.log(JSON.stringify(outputSchemas, null, 2));
		}
	} else {
		console.log(
			`Conversion completed successfully. Files are saved in ${outputFolder}`,
		);
	}
} catch (error) {
	console.error(`Conversion failed: ${error}`);
	console.error(
		'Suggestion: Run with --help for parameters or check supplied configuration',
	);
	process.exit(-1);
}

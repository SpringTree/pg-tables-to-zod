import { parseArgs } from "node:util";
import { z } from "zod";
import { version } from "../package.json";
import { checkConfiguration } from "./config/check.js";
import type { TConfiguration } from "./config/index.js";
import { mergeConfigurations } from "./config/merge.js";
import { readConfigFile } from "./config/read-file.js";
import { convert } from "./converter/index.js";
import { PromptAbortedError, promptPassword } from "./prompt-password.js";

const helpText = `Usage: pgtables2zod [options]

Options:
  -V, --version                 output the version number
  -c, --config <value>          Path to configuration file. Additional parameters override config values
  --pg-host <value>             The postgresql host to connect to
  --pg-port <n>                 The postgresql port to connect to. Defaults to 5432
  --pg-database <value>         The postgresql database to connect to
  --pg-user <value>             The postgresql user to login with
  --pg-password <value>         The postgresql password to login with
  --pg-schema <value>           Comma separated list of schemas to convert
  -o, --out <folder>            Output folder. Default output is to STDOUT. A sub-folder will be created per schema
  -s, --strict <value>          Allow additional properties on final schema. Default: true
  -t, --include-tables <value>  Comma separated list of tables to process. Default is all tables found
  -e, --exclude-tables <value>  Comma separated list of tables to exclude. Default is to not exclude any
  -u, --unwrap                  Unwraps the schema if only 1 is returned
  -d, --desc <value>            Default description when database lacks one.
  -h, --help                    display help for command`;

// Parses the command-line arguments. parseArgs is built into Node.js and Bun and throws on unknown options
//
function parseCliOptions(cliArguments: string[]) {
  return parseArgs({
    args: cliArguments,
    options: {
      config: { type: "string", short: "c" },
      desc: { type: "string", short: "d" },
      "exclude-tables": { type: "string", short: "e" },
      help: { type: "boolean", short: "h" },
      "include-tables": { type: "string", short: "t" },
      out: { type: "string", short: "o" },
      "pg-database": { type: "string" },
      "pg-host": { type: "string" },
      "pg-password": { type: "string" },
      "pg-port": { type: "string" },
      "pg-schema": { type: "string" },
      "pg-user": { type: "string" },
      strict: { type: "string", short: "s" },
      unwrap: { type: "boolean", short: "u" },
      version: { type: "boolean", short: "V" },
    },
  }).values;
}

// Runs the command-line utility and returns the process exit code
//
export async function runCli(cliArguments: string[]): Promise<number> {
  let options: ReturnType<typeof parseCliOptions>;
  try {
    options = parseCliOptions(cliArguments);
  } catch (error) {
    console.error(`${(error as Error).message}\n\n${helpText}`);
    return 1;
  }

  if (options.version) {
    console.log(version);
    return 0;
  }
  if (options.help || Object.keys(options).length === 0) {
    console.log(helpText);
    return 0;
  }

  // Option values are strings. Port and strict are converted so the configuration check accepts them.
  // A strict value other than true or false is passed on as is for the check to report
  //
  const strictOption = options.strict;
  const strict = strictOption === "true" ? true : strictOption === "false" ? false : strictOption;

  const cliConfiguration: TConfiguration = {
    pg: {
      host: options["pg-host"] as string,
      database: options["pg-database"] as string,
      port: options["pg-port"] === undefined ? undefined : Number(options["pg-port"]),
      user: options["pg-user"] as string,
      password: options["pg-password"],
    },
    input: {
      schemas: options["pg-schema"]?.split(","),
      include: options["include-tables"]?.split(","),
      exclude: options["exclude-tables"]?.split(","),
    },
    output: {
      outDir: options.out,
      unwrap: options.unwrap,
      strict: strict as boolean | undefined,
      defaultDescription: options.desc,
    },
  };

  let configuration = cliConfiguration;
  if (options.config) {
    try {
      // Apply the configuration file values, overridden by CLI options
      //
      const configFromFile = await readConfigFile(options.config);
      configuration = mergeConfigurations(configFromFile, cliConfiguration);
    } catch (error) {
      console.error(`Failed to read configuration file at ${options.config}:`, error);
      return 1;
    }
  }
  configuration.pg.port ??= 5432;

  // If password is not provided, prompt for it. Ctrl+c exits with 130 like a terminal interrupt
  //
  if (!configuration.pg.password) {
    try {
      configuration.pg.password = await promptPassword("Password? ");
    } catch (error) {
      if (error instanceof PromptAbortedError) {
        return 130;
      }
      throw error;
    }
  }

  // Check the configuration using Zod
  //
  try {
    checkConfiguration(configuration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Configuration has issues:", error.issues);
    } else {
      console.error("Configuration is invalid:", error);
    }
    return 1;
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
      console.log(`Conversion completed successfully. Files are saved in ${outputFolder}`);
    }
  } catch (error) {
    console.error(`Conversion failed: ${error as Error}`);
    console.error("Suggestion: Run with --help for parameters or check supplied configuration");
    return -1;
  }

  return 0;
}

//

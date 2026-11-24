import { afterAll, afterEach, beforeEach, expect, spyOn, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { version } from "../package.json";
import * as promptPasswordModule from "../src/prompt-password";
import { runCli } from "../src/run-cli";
import { connectToDatabase } from "./helpers/fixture-database";

const connectionArguments = [
  "--pg-host",
  "localhost",
  "--pg-database",
  "fixture",
  "--pg-user",
  "postgres",
  "--pg-password",
  "fixture-secret",
];

const consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
const consoleWarnSpy = spyOn(console, "warn").mockImplementation(() => {});

let temporaryFolder: string;

beforeEach(async () => {
  temporaryFolder ??= await mkdtemp(join(tmpdir(), "pg-tables-to-zod-"));
  connectToDatabase.mockClear();
  consoleLogSpy.mockClear();
  consoleErrorSpy.mockClear();
  consoleWarnSpy.mockClear();
});

afterEach(() => {
  promptPasswordSpy?.mockRestore();
});

afterAll(async () => {
  await rm(temporaryFolder, { recursive: true, force: true });
});

let promptPasswordSpy: ReturnType<typeof spyOn<typeof promptPasswordModule, "promptPassword">>;

async function writeConfigFile(configuration: object) {
  const configPath = join(temporaryFolder, "config.json");
  await writeFile(configPath, JSON.stringify(configuration));
  return configPath;
}

test("successfully print the version", async () => {
  expect(await runCli(["--version"])).toBe(0);
  expect(consoleLogSpy).toHaveBeenCalledWith(version);
});

test("successfully print the help", async () => {
  expect(await runCli(["--help"])).toBe(0);
  expect(consoleLogSpy.mock.calls[0]?.[0]).toStartWith("Usage: pgtables2zod [options]");
});

test("successfully print the help when no options are given", async () => {
  expect(await runCli([])).toBe(0);
  expect(consoleLogSpy.mock.calls[0]?.[0]).toStartWith("Usage: pgtables2zod [options]");
});

test("successfully print the schemas as JSON when no output folder is given", async () => {
  expect(await runCli([...connectionArguments, "--pg-schema", "shop"])).toBe(0);

  const printedSchemas = JSON.parse(consoleLogSpy.mock.calls[0]?.[0] as string) as unknown[];
  expect(printedSchemas).toHaveLength(4);
});

test("successfully pass the converted command-line options to the converter", async () => {
  const exitCode = await runCli([
    ...connectionArguments,
    "--pg-port",
    "6543",
    "--pg-schema",
    "public,shop",
    "--include-tables",
    "public.audit_entry,shop.sales_order",
    "--exclude-tables",
    "shop.sales_order",
    "--strict",
    "false",
    "--desc",
    "Fixture",
  ]);

  expect(exitCode).toBe(0);
  expect(connectToDatabase).toHaveBeenCalledWith(
    {
      host: "localhost",
      database: "fixture",
      port: 6543,
      user: "postgres",
      password: "fixture-secret",
    },
    { includeSchemas: ["public", "shop"], includeSystemSchemas: true },
  );
  const printedSchemas = JSON.parse(consoleLogSpy.mock.calls[0]?.[0] as string) as {
    path: string;
    schema: string;
  }[];
  expect(printedSchemas.map((printedSchema) => printedSchema.path.split("/").pop())).toEqual([
    "pg-types.ts",
    "audit_entry.ts",
  ]);
  expect(printedSchemas[1]?.schema).toContain(".object({");
  expect(printedSchemas[1]?.schema).not.toContain(".strictObject({");
  expect(printedSchemas[1]?.schema).toContain("describe(`Fixture. Database type: integer.");
});

test("successfully write the schemas to the output folder", async () => {
  const outputFolder = join(temporaryFolder, "output");

  expect(await runCli([...connectionArguments, "--out", outputFolder])).toBe(0);
  expect(consoleLogSpy).toHaveBeenCalledWith(
    `Conversion completed successfully. Files are saved in ${outputFolder}`,
  );
  expect(await Bun.file(join(outputFolder, "public", "audit_entry.ts")).exists()).toBe(true);
});

test("successfully override the configuration file values with command-line options", async () => {
  const configPath = await writeConfigFile({
    pg: {
      host: "file-host",
      database: "file-db",
      port: 5433,
      user: "file-user",
      password: "file-secret",
    },
    input: { schemas: ["shop"] },
    output: {},
  });

  expect(await runCli(["--config", configPath, "--pg-host", "cli-host"])).toBe(0);
  expect(connectToDatabase).toHaveBeenCalledWith(
    {
      host: "cli-host",
      database: "file-db",
      port: 5433,
      user: "file-user",
      password: "file-secret",
    },
    { includeSchemas: ["shop"], includeSystemSchemas: true },
  );
});

test("successfully prompt for the password when none is given", async () => {
  promptPasswordSpy = spyOn(promptPasswordModule, "promptPassword").mockResolvedValue(
    "prompted-secret",
  );

  expect(
    await runCli(["--pg-host", "localhost", "--pg-database", "fixture", "--pg-user", "postgres"]),
  ).toBe(0);
  expect(promptPasswordSpy).toHaveBeenCalledWith("Password? ");
  expect(connectToDatabase).toHaveBeenCalledWith(
    {
      host: "localhost",
      database: "fixture",
      port: 5432,
      user: "postgres",
      password: "prompted-secret",
    },
    { includeSchemas: ["public"], includeSystemSchemas: true },
  );
});

test("fail running when the password prompt is aborted", async () => {
  promptPasswordSpy = spyOn(promptPasswordModule, "promptPassword").mockRejectedValue(
    new promptPasswordModule.PromptAbortedError(),
  );

  expect(await runCli(["--pg-host", "localhost"])).toBe(130);
  expect(connectToDatabase).not.toHaveBeenCalled();
});

test("fail running when the password prompt fails", async () => {
  promptPasswordSpy = spyOn(promptPasswordModule, "promptPassword").mockRejectedValue(
    new Error("stdin closed"),
  );

  expect(runCli(["--pg-host", "localhost"])).rejects.toThrow("stdin closed");
});

test("fail running when an option is unknown", async () => {
  expect(await runCli(["--unknown"])).toBe(1);
  expect(consoleErrorSpy.mock.calls[0]?.[0]).toStartWith("Unknown option '--unknown'");
});

test("fail running when the configuration file cannot be read", async () => {
  const missingPath = join(temporaryFolder, "missing-%s.json");

  expect(await runCli(["--config", missingPath])).toBe(1);
  expect(consoleErrorSpy.mock.calls[0]?.slice(0, 2)).toEqual([
    "Failed to read configuration file at %s:",
    missingPath,
  ]);
});

test("fail running when the removed unwrap option is given", async () => {
  expect(await runCli([...connectionArguments, "--unwrap"])).toBe(1);
  expect(consoleErrorSpy.mock.calls[0]?.[0]).toStartWith("Unknown option '--unwrap'");
});

test("fail running when the configuration file contains the removed unwrap setting", async () => {
  const configPath = await writeConfigFile({
    pg: { host: "localhost", database: "fixture", user: "postgres", password: "fixture-secret" },
    input: {},
    output: { unwrap: true },
  });

  expect(await runCli(["--config", configPath])).toBe(1);
  expect(consoleErrorSpy.mock.calls[0]?.[0]).toBe("Configuration has issues:");
  expect(connectToDatabase).not.toHaveBeenCalled();
});

test("fail running when the configuration is invalid", async () => {
  expect(await runCli([...connectionArguments, "--strict", "maybe"])).toBe(1);
  expect(consoleErrorSpy.mock.calls[0]?.[0]).toBe("Configuration has issues:");
  expect(connectToDatabase).not.toHaveBeenCalled();
});

test("fail running when the conversion fails", async () => {
  connectToDatabase.mockRejectedValueOnce(new Error("connection refused"));

  expect(await runCli(connectionArguments)).toBe(-1);
  expect(consoleErrorSpy.mock.calls[0]?.[0]).toBe("Conversion failed: Error: connection refused");
});

//

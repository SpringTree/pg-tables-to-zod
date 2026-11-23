import { afterAll, beforeEach, expect, spyOn, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import type { EnumType } from "pg-structure";
import type { z } from "zod";
import { connectToDatabase, fixtureDatabase } from "./helpers/fixture-database";
import { convert, type TConfiguration } from "../src";

const pgConfiguration: TConfiguration["pg"] = {
  host: "localhost",
  database: "fixture",
  port: 5432,
  user: "postgres",
  password: "fixture-secret",
};

const fixtureConfiguration: TConfiguration = {
  pg: pgConfiguration,
  input: { schemas: ["public", "shop"] },
  output: { defaultDescription: "Fixture" },
};

// The converter reports progress with console.warn, silenced here and asserted where relevant
//
const consoleWarnSpy = spyOn(console, "warn").mockImplementation(() => {});

const temporaryFolders: string[] = [];

beforeEach(() => {
  connectToDatabase.mockClear();
  consoleWarnSpy.mockClear();
});

afterAll(async () => {
  for (const folder of temporaryFolders) {
    await rm(folder, { recursive: true, force: true });
  }
});

// Output paths are absolute, make them relative to the output folder so snapshots are machine independent
//
async function convertToRelativePaths(configuration: TConfiguration, outputFolder: string) {
  const outputSchemas = await convert(configuration);
  return outputSchemas.map((outputSchema) => ({
    path: relative(outputFolder, outputSchema.path),
    schema: outputSchema.schema,
  }));
}

test("successfully convert all tables, views and materialized views", async () => {
  const outputSchemas = await convertToRelativePaths(fixtureConfiguration, "dist/validators");

  expect(outputSchemas.map((outputSchema) => outputSchema.path)).toEqual([
    "pg-types.ts",
    "public/audit_entry.ts",
    "public/customer_account.ts",
    "public/escape_check.ts",
    "public/HTTPRequestLog.ts",
    "shop/order_totals.ts",
    "shop/paid_orders.ts",
    "shop/sales_order.ts",
  ]);
  expect(outputSchemas).toMatchSnapshot();
});

test("successfully pass the connection settings and schemas to the database", async () => {
  await convert(fixtureConfiguration);

  expect(connectToDatabase).toHaveBeenCalledTimes(1);
  expect(connectToDatabase).toHaveBeenCalledWith(pgConfiguration, {
    includeSchemas: ["public", "shop"],
    includeSystemSchemas: true,
  });
});

test("successfully convert the public schema when no schemas are configured", async () => {
  const outputSchemas = await convertToRelativePaths(
    { pg: pgConfiguration, input: {}, output: {} },
    "dist/validators",
  );

  expect(connectToDatabase).toHaveBeenCalledWith(pgConfiguration, {
    includeSchemas: ["public"],
    includeSystemSchemas: true,
  });
  expect(outputSchemas.map((outputSchema) => outputSchema.path)).toEqual([
    "pg-types.ts",
    "public/audit_entry.ts",
    "public/customer_account.ts",
    "public/escape_check.ts",
    "public/HTTPRequestLog.ts",
  ]);
});

test("successfully convert to non strict objects without column descriptions when strict is false and no default description is set", async () => {
  const outputSchemas = await convertToRelativePaths(
    {
      pg: pgConfiguration,
      input: { schemas: ["shop"], include: ["shop.sales_order"] },
      output: { strict: false },
    },
    "dist/validators",
  );

  expect(outputSchemas).toMatchSnapshot();
});

test("successfully convert only the included entities", async () => {
  const outputSchemas = await convertToRelativePaths(
    {
      ...fixtureConfiguration,
      input: {
        schemas: ["public", "shop"],
        include: ["public.audit_entry", "shop.paid_orders", "shop.order_totals"],
      },
    },
    "dist/validators",
  );

  expect(outputSchemas.map((outputSchema) => outputSchema.path)).toEqual([
    "pg-types.ts",
    "public/audit_entry.ts",
    "shop/order_totals.ts",
    "shop/paid_orders.ts",
  ]);
});

test("successfully skip the excluded entities", async () => {
  const outputSchemas = await convertToRelativePaths(
    {
      ...fixtureConfiguration,
      input: {
        schemas: ["public", "shop"],
        exclude: ["public.customer_account", "shop.paid_orders", "shop.order_totals"],
      },
    },
    "dist/validators",
  );

  expect(outputSchemas.map((outputSchema) => outputSchema.path)).toEqual([
    "pg-types.ts",
    "public/audit_entry.ts",
    "public/escape_check.ts",
    "public/HTTPRequestLog.ts",
    "shop/sales_order.ts",
  ]);
  expect(consoleWarnSpy).toHaveBeenCalledWith("Skipping excluded table customer_account");
});

test("successfully default to any for an unsupported column type", async () => {
  const outputSchemas = await convertToRelativePaths(
    { ...fixtureConfiguration, input: { include: ["public.customer_account"] } },
    "dist/validators",
  );

  expect(consoleWarnSpy).toHaveBeenCalledWith("Unsupported column type: inet. Defaulting to any");
  expect(outputSchemas[1]?.path).toBe("public/customer_account.ts");
  expect(outputSchemas[1]?.schema).toContain("ip_address: z.any()");
});

test("successfully write the schema files when an output folder is configured", async () => {
  const outputFolder = await mkdtemp(join(tmpdir(), "pg-tables-to-zod-"));
  temporaryFolders.push(outputFolder);

  const outputSchemas = await convertToRelativePaths(
    { ...fixtureConfiguration, output: { ...fixtureConfiguration.output, outDir: outputFolder } },
    outputFolder,
  );

  for (const outputSchema of outputSchemas) {
    const fileContents = await readFile(join(outputFolder, outputSchema.path), "utf8");
    expect(fileContents).toBe(outputSchema.schema);
  }
});

test("successfully keep comments, defaults and enum values intact when they contain characters that need escaping", async () => {
  // Written below node_modules so the generated files can import zod
  //
  const cacheFolder = join(import.meta.dir, "../node_modules/.cache");
  await mkdir(cacheFolder, { recursive: true });
  const outputFolder = await mkdtemp(join(cacheFolder, "pg-tables-to-zod-"));
  temporaryFolders.push(outputFolder);

  await convert({
    ...fixtureConfiguration,
    input: { include: ["public.escape_check"] },
    output: { outDir: outputFolder, defaultDescription: "Fixture" },
  });

  const escapeCheckTable = fixtureDatabase.schemas.get("public").tables.get("escape_check");
  const noteColumn = escapeCheckTable.columns.get("note");
  const quoteStyleType = fixtureDatabase.schemas.get("public").types.get("quote_style") as EnumType;

  const { default: escapeCheckSchema } = (await import(
    join(outputFolder, "public", "escape_check.ts")
  )) as { default: z.ZodObject<{ note: z.ZodOptional<z.ZodString> }> };
  const { QuoteStyleSchema } = (await import(join(outputFolder, "pg-types.ts"))) as {
    QuoteStyleSchema: z.ZodEnum;
  };

  expect(escapeCheckSchema.description).toBe(escapeCheckTable.comment);
  expect(escapeCheckSchema.shape.note.unwrap().description).toBe(
    `${noteColumn.comment}. Database type: text. Default value: ${noteColumn.default}`,
  );
  expect(QuoteStyleSchema.options).toEqual(quoteStyleType.values);
  expect(QuoteStyleSchema.description).toBe(quoteStyleType.comment);
});

test("fail converting when the configuration is invalid", async () => {
  const invalidConfiguration = {
    ...fixtureConfiguration,
    pg: { ...pgConfiguration, port: -1 },
  };

  expect(convert(invalidConfiguration)).rejects.toThrow();
  expect(connectToDatabase).not.toHaveBeenCalled();
});

//

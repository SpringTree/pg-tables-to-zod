import { expect, test } from "bun:test";
import type { TConfiguration } from "../src";
import { mergeConfigurations } from "../src/config/merge";

const fileConfiguration: TConfiguration = {
  pg: {
    host: "file-host",
    database: "file-db",
    port: 5433,
    user: "file-user",
    password: "file-secret",
  },
  input: { schemas: ["public"], exclude: ["file_table"] },
  output: { outDir: "file-out", strict: true },
};

const emptyCliConfiguration: TConfiguration = {
  pg: {
    host: undefined as unknown as string,
    database: undefined as unknown as string,
    user: undefined as unknown as string,
  },
  input: {},
  output: {},
};

test("successfully keep the file values when no command-line options are given", () => {
  expect(mergeConfigurations(fileConfiguration, emptyCliConfiguration)).toEqual(fileConfiguration);
});

test("successfully override the file values when command-line options are given", () => {
  const cliConfiguration: TConfiguration = {
    ...emptyCliConfiguration,
    pg: { ...emptyCliConfiguration.pg, host: "cli-host", port: 6543 },
    input: { schemas: ["cli_schema"] },
    output: { strict: false },
  };

  expect(mergeConfigurations(fileConfiguration, cliConfiguration)).toEqual({
    pg: {
      host: "cli-host",
      database: "file-db",
      port: 6543,
      user: "file-user",
      password: "file-secret",
    },
    input: { schemas: ["cli_schema"], exclude: ["file_table"] },
    output: { outDir: "file-out", strict: false },
  });
});

test("successfully merge when the file lacks a section", () => {
  const cliConfiguration: TConfiguration = {
    ...emptyCliConfiguration,
    pg: { host: "cli-host", database: "cli-db", user: "cli-user" },
  };

  expect(mergeConfigurations({}, cliConfiguration)).toEqual({
    pg: { host: "cli-host", database: "cli-db", user: "cli-user" },
    input: {},
    output: {},
  });
});

//

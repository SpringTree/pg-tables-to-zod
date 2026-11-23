import { readFile } from "node:fs/promises";
import type { TConfiguration } from "./index.js";

// Reads a JSON configuration file. Uses node:fs so the published CLI runs under both Node.js and Bun
//
export async function readConfigFile(filePath: string): Promise<Partial<TConfiguration>> {
  const fileContents = await readFile(filePath, "utf8");
  return JSON.parse(fileContents) as Partial<TConfiguration>;
}

//

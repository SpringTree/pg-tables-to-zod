import { z } from "zod";

const outputConfigurationSchema = z
  .object({
    outDir: z
      .string()
      .optional()
      .describe(
        "The output folder to write all the schema files to. If omitted all the schemas will be output to STDOUT.",
      ),
    strict: z
      .boolean()
      .optional()
      .describe(
        "Sets the zod schemas to be strict and not accept unknown properties. Defaults to true",
      ),
    defaultDescription: z
      .string()
      .optional()
      .describe(
        "The default description to set for structure items that lack one. Defaults to: No description available for <name>",
      ),
  })
  .strict()
  .describe("Database setting configuration");

export type TOutputConfiguration = z.infer<typeof outputConfigurationSchema>;
export default outputConfigurationSchema;

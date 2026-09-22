import { z } from "zod";

export const MetadataConfigType: z.ZodObject<{
  useFileCreationTimeForDateAdded: z.ZodOptional<z.ZodBoolean>;
}> = z
  .object({
    useFileCreationTimeForDateAdded: z.boolean().optional(),
  })
  .strict();

export type MetadataConfig = z.infer<typeof MetadataConfigType>;

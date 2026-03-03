import { z } from "zod";

export const NetworkConfigType: z.ZodObject<{
  knownProxies: z.ZodOptional<z.ZodArray<z.ZodString>>;
}> = z
  .object({
    knownProxies: z.array(z.string().min(1)).optional(),
  })
  .strict();

export type NetworkConfig = z.infer<typeof NetworkConfigType>;

import type { MetadataConfig } from "../types/config/metadata";
import type { MetadataConfigurationSchema } from "../types/schema/metadata";

export function mapMetadataConfigToSchema(
  desired: MetadataConfig,
): Partial<MetadataConfigurationSchema> {
  const out: Partial<MetadataConfigurationSchema> = {};

  if (typeof desired.useFileCreationTimeForDateAdded !== "undefined") {
    out.UseFileCreationTimeForDateAdded =
      desired.useFileCreationTimeForDateAdded;
  }

  return out;
}

import type { JellyfinClient } from "../api/jellyfin.types";
import { ChangeSetBuilder } from "../lib/changeset";
import { logger } from "../lib/logger";
import { mapMetadataConfigToSchema } from "../mappers/metadata";
import type { MetadataConfig } from "../types/config/metadata";
import type { MetadataConfigurationSchema } from "../types/schema/metadata";
import { applyChangeset, diff, type IChange } from "json-diff-ts";

export function calculateMetadataDiff(
  current: MetadataConfigurationSchema,
  desired: MetadataConfig,
): MetadataConfigurationSchema | undefined {
  if (typeof desired.useFileCreationTimeForDateAdded === "undefined") {
    return undefined;
  }

  const next: Partial<MetadataConfigurationSchema> =
    mapMetadataConfigToSchema(desired);

  const patch: IChange[] = new ChangeSetBuilder(
    diff(current, next, { treatTypeChangeAsReplace: false }),
  )
    .withKey("UseFileCreationTimeForDateAdded")
    .toArray();

  if (patch.length !== 0) {
    logger.info(JSON.stringify(patch));
    return applyChangeset(current, patch) as MetadataConfigurationSchema;
  }

  return undefined;
}

export async function applyMetadata(
  client: JellyfinClient,
  updatedSchema: MetadataConfigurationSchema | undefined,
): Promise<void> {
  if (!updatedSchema) return;

  await client.updateMetadataConfiguration(updatedSchema);
}

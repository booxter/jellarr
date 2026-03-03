import { logger } from "../lib/logger";
import type { JellyfinClient } from "../api/jellyfin.types";
import { mapNetworkConfigurationConfigToSchema } from "../mappers/network";
import type { SystemConfig } from "../types/config/system";
import type { NetworkConfigurationSchema } from "../types/schema/network";
import { applyChangeset, diff, type IChange } from "json-diff-ts";
import { ChangeSetBuilder } from "../lib/changeset";

export function calculateNetworkDiff(
  current: NetworkConfigurationSchema,
  desired: SystemConfig,
): NetworkConfigurationSchema | undefined {
  if (typeof desired.knownProxies === "undefined") {
    return undefined;
  }

  const next: NetworkConfigurationSchema =
    mapNetworkConfigurationConfigToSchema(desired);

  const patch: IChange[] = new ChangeSetBuilder(
    diff(current, next, { treatTypeChangeAsReplace: false }),
  )
    .withKey("KnownProxies")
    .toArray();

  if (patch.length != 0) {
    logger.info(JSON.stringify(patch));
    return applyChangeset(current, patch) as NetworkConfigurationSchema;
  }

  return undefined;
}

export async function applyNetwork(
  client: JellyfinClient,
  updatedSchema: NetworkConfigurationSchema | undefined,
): Promise<void> {
  if (!updatedSchema) return;

  await client.updateNetworkConfiguration(updatedSchema);
}

import type { SystemConfig } from "../types/config/system";
import type { NetworkConfigurationSchema } from "../types/schema/network";

export function mapNetworkConfigurationConfigToSchema(
  desired: SystemConfig,
): Partial<NetworkConfigurationSchema> {
  const out: Partial<NetworkConfigurationSchema> = {};

  if (typeof desired.knownProxies !== "undefined") {
    out.KnownProxies = desired.knownProxies;
  }

  return out;
}

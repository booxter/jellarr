import { describe, it, expect } from "vitest";
import { mapNetworkConfigurationConfigToSchema } from "../../src/mappers/network";
import type { SystemConfig } from "../../src/types/config/system";
import type { NetworkConfigurationSchema } from "../../src/types/schema/network";

describe("mappers/network", () => {
  describe("mapNetworkConfigurationConfigToSchema", () => {
    it("should map knownProxies to KnownProxies", () => {
      const config: SystemConfig = {
        knownProxies: ["127.0.0.1", "10.0.0.1"],
      };

      const result: Partial<NetworkConfigurationSchema> =
        mapNetworkConfigurationConfigToSchema(config);

      expect(result).toEqual({
        KnownProxies: ["127.0.0.1", "10.0.0.1"],
      });
    });

    it("should map empty knownProxies to empty KnownProxies", () => {
      const config: SystemConfig = {
        knownProxies: [],
      };

      const result: Partial<NetworkConfigurationSchema> =
        mapNetworkConfigurationConfigToSchema(config);

      expect(result).toEqual({
        KnownProxies: [],
      });
    });

    it("should not include KnownProxies when knownProxies is undefined", () => {
      const config: SystemConfig = {};

      const result: Partial<NetworkConfigurationSchema> =
        mapNetworkConfigurationConfigToSchema(config);

      expect(result).toEqual({});
      expect(result).not.toHaveProperty("KnownProxies");
    });
  });
});

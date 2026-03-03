import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { calculateNetworkDiff, applyNetwork } from "../../src/apply/network";
import type { JellyfinClient } from "../../src/api/jellyfin.types";
import type { NetworkConfig } from "../../src/types/config/network";
import type { NetworkConfigurationSchema } from "../../src/types/schema/network";

vi.mock("../../src/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("apply/network", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateNetworkDiff", () => {
    it("should preserve KnownProxies when knownProxies is undefined", () => {
      const current: NetworkConfigurationSchema = {
        KnownProxies: ["127.0.0.1"],
      } as NetworkConfigurationSchema;

      const desired: NetworkConfig = {};

      const result: NetworkConfigurationSchema | undefined =
        calculateNetworkDiff(current, desired);

      expect(result).toBeUndefined();
    });

    it("should update KnownProxies when knownProxies changes", () => {
      const current: NetworkConfigurationSchema = {
        KnownProxies: ["10.0.0.1"],
      } as NetworkConfigurationSchema;

      const desired: NetworkConfig = {
        knownProxies: ["127.0.0.1", "10.0.0.2"],
      };

      const result: NetworkConfigurationSchema | undefined =
        calculateNetworkDiff(current, desired);

      expect(result?.KnownProxies).toEqual(["127.0.0.1", "10.0.0.2"]);
    });

    it("should clear KnownProxies when knownProxies is empty", () => {
      const current: NetworkConfigurationSchema = {
        KnownProxies: ["127.0.0.1"],
      } as NetworkConfigurationSchema;

      const desired: NetworkConfig = {
        knownProxies: [],
      };

      const result: NetworkConfigurationSchema | undefined =
        calculateNetworkDiff(current, desired);

      expect(result?.KnownProxies).toEqual([]);
    });

    it("should not modify KnownProxies when content is identical", () => {
      const current: NetworkConfigurationSchema = {
        KnownProxies: ["127.0.0.1"],
      } as NetworkConfigurationSchema;

      const desired: NetworkConfig = {
        knownProxies: ["127.0.0.1"],
      };

      const result: NetworkConfigurationSchema | undefined =
        calculateNetworkDiff(current, desired);

      expect(result).toBeUndefined();
    });
  });

  describe("applyNetwork", () => {
    let mockClient: JellyfinClient;
    let updateSpy: Mock;

    beforeEach(() => {
      updateSpy = vi.fn();
      mockClient = {
        updateNetworkConfiguration: updateSpy,
      } as unknown as JellyfinClient;
    });

    it("should do nothing when schema is undefined", async () => {
      await applyNetwork(mockClient, undefined);
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it("should call client.updateNetworkConfiguration with schema", async () => {
      const schema: NetworkConfigurationSchema = {
        KnownProxies: ["127.0.0.1"],
      } as NetworkConfigurationSchema;

      updateSpy.mockResolvedValue(undefined);

      await applyNetwork(mockClient, schema);

      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(updateSpy).toHaveBeenCalledWith(schema);
    });
  });
});

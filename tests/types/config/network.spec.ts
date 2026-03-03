import { describe, it, expect } from "vitest";
import type { ZodSafeParseResult } from "zod";
import { type z } from "zod";
import {
  NetworkConfigType,
  type NetworkConfig,
} from "../../../src/types/config/network";

describe("NetworkConfig", () => {
  it("should validate empty network config", () => {
    const validConfig: z.input<typeof NetworkConfigType> = {};

    const result: ZodSafeParseResult<NetworkConfig> =
      NetworkConfigType.safeParse(validConfig);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({});
    }
  });

  it("should allow knownProxies", () => {
    const config: z.input<typeof NetworkConfigType> = {
      knownProxies: ["127.0.0.1", "10.0.0.1"],
    };

    const result = NetworkConfigType.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.knownProxies).toEqual(["127.0.0.1", "10.0.0.1"]);
    }
  });

  it("should reject non-string knownProxies entries", () => {
    const config: z.input<typeof NetworkConfigType> = {
      // @ts-expect-error intentional bad type for test
      knownProxies: ["127.0.0.1", 1234],
    };

    const result = NetworkConfigType.safeParse(config);

    expect(result.success).toBe(false);
  });
});

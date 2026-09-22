import { describe, expect, it } from "vitest";
import {
  MetadataConfigType,
  type MetadataConfig,
} from "../../../src/types/config/metadata";
import type { ZodSafeParseResult, z } from "zod";

describe("MetadataConfig", () => {
  it("should validate an empty metadata config", () => {
    const config: z.input<typeof MetadataConfigType> = {};

    const result: ZodSafeParseResult<MetadataConfig> =
      MetadataConfigType.safeParse(config);

    expect(result.success).toBe(true);
  });

  it.each([true, false])(
    "should allow useFileCreationTimeForDateAdded=%s",
    (value: boolean) => {
      const result = MetadataConfigType.safeParse({
        useFileCreationTimeForDateAdded: value,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.useFileCreationTimeForDateAdded).toBe(value);
      }
    },
  );

  it("should reject a non-boolean value", () => {
    const result = MetadataConfigType.safeParse({
      useFileCreationTimeForDateAdded: "false",
    });

    expect(result.success).toBe(false);
  });
});

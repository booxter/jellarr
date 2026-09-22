import { describe, expect, it } from "vitest";
import { mapMetadataConfigToSchema } from "../../src/mappers/metadata";

describe("mappers/metadata", () => {
  it.each([true, false])(
    "should map useFileCreationTimeForDateAdded=%s",
    (value: boolean) => {
      expect(
        mapMetadataConfigToSchema({
          useFileCreationTimeForDateAdded: value,
        }),
      ).toEqual({ UseFileCreationTimeForDateAdded: value });
    },
  );

  it("should omit an unspecified setting", () => {
    expect(mapMetadataConfigToSchema({})).toEqual({});
  });
});

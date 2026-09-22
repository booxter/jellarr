import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { applyMetadata, calculateMetadataDiff } from "../../src/apply/metadata";
import type { JellyfinClient } from "../../src/api/jellyfin.types";
import type { MetadataConfigurationSchema } from "../../src/types/schema/metadata";

vi.mock("../../src/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("apply/metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should preserve the setting when it is unspecified", () => {
    const current: MetadataConfigurationSchema = {
      UseFileCreationTimeForDateAdded: true,
    };

    expect(calculateMetadataDiff(current, {})).toBeUndefined();
  });

  it("should update the setting when it differs", () => {
    const current: MetadataConfigurationSchema = {
      UseFileCreationTimeForDateAdded: true,
    };

    expect(
      calculateMetadataDiff(current, {
        useFileCreationTimeForDateAdded: false,
      }),
    ).toEqual({ UseFileCreationTimeForDateAdded: false });
  });

  it("should not update the setting when it is unchanged", () => {
    const current: MetadataConfigurationSchema = {
      UseFileCreationTimeForDateAdded: false,
    };

    expect(
      calculateMetadataDiff(current, {
        useFileCreationTimeForDateAdded: false,
      }),
    ).toBeUndefined();
  });

  it("should apply an updated configuration", async () => {
    const updateMetadataConfiguration: Mock = vi.fn();
    const client = {
      updateMetadataConfiguration,
    } as unknown as JellyfinClient;
    const updated: MetadataConfigurationSchema = {
      UseFileCreationTimeForDateAdded: false,
    };

    await applyMetadata(client, updated);

    expect(updateMetadataConfiguration).toHaveBeenCalledWith(updated);
  });

  it("should do nothing without an updated configuration", async () => {
    const updateMetadataConfiguration: Mock = vi.fn();
    const client = {
      updateMetadataConfiguration,
    } as unknown as JellyfinClient;

    await applyMetadata(client, undefined);

    expect(updateMetadataConfiguration).not.toHaveBeenCalled();
  });
});

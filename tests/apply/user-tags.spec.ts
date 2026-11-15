import { describe, expect, it } from "vitest";
import { calculateUserPoliciesDiff } from "../../src/apply/users";
import type {
  UserPolicyConfig,
  UserConfigList,
} from "../../src/types/config/users";
import type {
  UserDtoSchema,
  UserPolicySchema,
} from "../../src/types/schema/users";

describe("user tag restrictions", () => {
  const current: UserDtoSchema[] = [
    {
      Id: "alex",
      Name: "Alex",
      Policy: {
        AllowedTags: ["old"],
        BlockedTags: ["private"],
        EnableAllFolders: false,
        EnabledFolders: ["movies"],
      },
    },
  ];

  it.each([
    [{ allowedTags: ["language_Russian"] }, ["language_Russian"], ["private"]],
    [{ blockedTags: ["adult"] }, ["old"], ["adult"]],
    [{ allowedTags: [], blockedTags: [] }, [], []],
  ] satisfies Array<[UserPolicyConfig, string[], string[]]>)(
    "updates specified tags and preserves library access: %j",
    (
      policy: UserPolicyConfig,
      allowed: readonly string[],
      blocked: readonly string[],
    ) => {
      const desired: UserConfigList = [
        { name: "Alex", password: "pass", policy },
      ];
      const result: Map<string, UserPolicySchema> | undefined =
        calculateUserPoliciesDiff(current, desired);
      const updated: UserPolicySchema | undefined = result?.get("alex");

      expect(result?.size).toBe(1);
      expect(updated).toEqual({
        AllowedTags: allowed,
        BlockedTags: blocked,
        EnableAllFolders: false,
        EnabledFolders: ["movies"],
      });
      expect(
        calculateUserPoliciesDiff(
          [{ ...current[0], Policy: updated }],
          desired,
        ),
      ).toBeUndefined();
    },
  );

  it("preserves tag restrictions when they are omitted", () => {
    expect(
      calculateUserPoliciesDiff(current, [
        {
          name: "Alex",
          password: "pass",
          policy: { enableContentDownloading: false },
        },
      ])?.get("alex"),
    ).toEqual({
      ...current[0].Policy,
      EnableContentDownloading: false,
    });
  });
});

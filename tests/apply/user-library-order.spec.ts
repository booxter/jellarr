import { describe, expect, it } from "vitest";
import { calculateUserConfigurationsDiff } from "../../src/apply/users";
import {
  UserConfigType,
  type UserConfigList,
} from "../../src/types/config/users";
import type { VirtualFolderInfoSchema } from "../../src/types/schema/library";
import type {
  UserDtoSchema,
  UserConfigurationSchema,
} from "../../src/types/schema/users";

describe("home screen library order", () => {
  const libraries: VirtualFolderInfoSchema[] = [
    { Name: "Music", ItemId: "music" },
    { Name: "Чердак", ItemId: "attic-ru" },
    { Name: "Фильмы", ItemId: "movies-ru" },
  ];
  const current: UserDtoSchema[] = [
    {
      Id: "alex",
      Name: "Alex",
      Configuration: {
        OrderedViews: ["music", "attic-ru", "movies-ru"],
        SubtitleMode: "Smart",
        MyMediaExcludes: ["hidden"],
      },
    },
    {
      Id: "other",
      Name: "Other",
      Configuration: { OrderedViews: ["music", "movies"] },
    },
  ];

  it("resolves names in the requested order without changing other preferences or users", () => {
    const desired: UserConfigList = [
      UserConfigType.parse({
        name: "Alex",
        password: "pass",
        orderedLibraries: ["Фильмы", "Чердак", "Music"],
      }),
      { name: "Other", password: "pass" },
    ];
    const updates: Map<string, UserConfigurationSchema> | undefined =
      calculateUserConfigurationsDiff(current, desired, libraries);
    const updated: UserConfigurationSchema | undefined = updates?.get("alex");

    expect(updates?.size).toBe(1);
    expect(updated).toEqual({
      OrderedViews: ["movies-ru", "attic-ru", "music"],
      SubtitleMode: "Smart",
      MyMediaExcludes: ["hidden"],
    });
    expect(
      calculateUserConfigurationsDiff(
        [{ ...current[0], Configuration: updated }, current[1]],
        desired,
        libraries,
      ),
    ).toBeUndefined();
    expect(current[0].Configuration?.OrderedViews).toEqual([
      "music",
      "attic-ru",
      "movies-ru",
    ]);
  });

  it("preserves an omitted order when updating another preference", () => {
    expect(
      calculateUserConfigurationsDiff(current, [
        { name: "Alex", password: "pass", subtitleMode: "Always" },
      ])?.get("alex"),
    ).toEqual({ ...current[0].Configuration, SubtitleMode: "Always" });
  });

  it("clears the order with an empty list, without needing library metadata", () => {
    expect(
      calculateUserConfigurationsDiff(current, [
        UserConfigType.parse({
          name: "Alex",
          password: "pass",
          orderedLibraries: [],
        }),
      ])?.get("alex"),
    ).toEqual({ ...current[0].Configuration, OrderedViews: [] });
  });

  it("rejects unknown library names", () => {
    expect(() =>
      calculateUserConfigurationsDiff(
        current,
        [{ name: "Alex", password: "pass", orderedLibraries: ["Missing"] }],
        libraries,
      ),
    ).toThrow("Library 'Missing' not found while resolving orderedLibraries");
  });

  it("rejects an empty library name", () => {
    expect(
      UserConfigType.safeParse({
        name: "Alex",
        password: "pass",
        orderedLibraries: [""],
      }).success,
    ).toBe(false);
  });
});

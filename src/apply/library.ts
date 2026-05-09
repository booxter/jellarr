import { logger } from "../lib/logger";
import type { JellyfinClient } from "../api/jellyfin.types";
import type { VirtualFolderConfig } from "../types/config/library";
import type {
  VirtualFolderInfoSchema,
  CollectionTypeSchema,
  AddVirtualFolderDtoSchema,
  UpdateLibraryOptionsDtoSchema,
  LibraryOptionsSchema,
} from "../types/schema/library";
import {
  mapVirtualFolderConfigToSchema,
  mapVirtualFolderInfoSchemaToAddVirtualFolderDtoSchema,
} from "../mappers/library";
import { diff } from "json-diff-ts";

export type LibraryDiff = {
  toCreate?: VirtualFolderInfoSchema[];
  toUpdate?: {
    id: string;
    name: string;
    libraryOptions: LibraryOptionsSchema;
  }[];
};

function resolveFolderId(
  folder: VirtualFolderInfoSchema | undefined,
): string | undefined {
  if (!folder) return undefined;
  return (
    (folder as { Id?: string }).Id ??
    (folder as { ItemId?: string | null }).ItemId ??
    undefined
  );
}

function projectDesiredShape(current: unknown, desired: unknown): unknown {
  if (Array.isArray(desired)) {
    return current;
  }

  if (desired && typeof desired === "object") {
    const currentObject: Record<string, unknown> =
      current && typeof current === "object"
        ? (current as Record<string, unknown>)
        : {};

    return Object.fromEntries(
      Object.entries(desired as Record<string, unknown>).map(
        ([key, desiredValue]: [string, unknown]) => [
          key,
          projectDesiredShape(currentObject[key], desiredValue),
        ],
      ),
    );
  }

  return current;
}

function hasLibraryOptionsDiff(
  current: LibraryOptionsSchema | undefined,
  desired: LibraryOptionsSchema,
): boolean {
  const projectedCurrent: unknown = projectDesiredShape(current, desired);
  return (
    diff(projectedCurrent, desired, {
      treatTypeChangeAsReplace: false,
    }).length > 0
  );
}

export function calculateLibraryDiff(
  current: VirtualFolderInfoSchema[],
  desired: VirtualFolderConfig[],
): LibraryDiff | undefined {
  if (desired.length === 0) {
    return undefined;
  }

  const next: VirtualFolderInfoSchema[] = desired.map(
    mapVirtualFolderConfigToSchema,
  );

  const currentByName: Map<string, VirtualFolderInfoSchema> = new Map(
    current
      .map((folder: VirtualFolderInfoSchema) =>
        folder.Name ? [folder.Name, folder] : undefined,
      )
      .filter(
        (
          entry:
            | [string, VirtualFolderInfoSchema]
            | undefined
            | [string, VirtualFolderInfoSchema | undefined],
        ): entry is [string, VirtualFolderInfoSchema] => Array.isArray(entry),
      ),
  );

  for (const folder of next) {
    const name: string | undefined = folder.Name ?? undefined;
    if (!name) continue;
    const currentFolder: VirtualFolderInfoSchema | undefined =
      currentByName.get(name);
    const currentType: string | undefined =
      (currentFolder?.CollectionType as string | undefined) ?? undefined;
    const desiredType: string | undefined =
      (folder.CollectionType as string | undefined) ?? undefined;
    if (
      currentFolder &&
      typeof currentType !== "undefined" &&
      typeof desiredType !== "undefined" &&
      currentType !== desiredType
    ) {
      throw new Error(
        `Library '${name}' collectionType change is not supported (current: ${currentType}, desired: ${desiredType})`,
      );
    }
  }

  const toCreate: VirtualFolderInfoSchema[] = [];
  const toUpdate: NonNullable<LibraryDiff["toUpdate"]> = [];
  for (const desiredFolder of next) {
    const name: string | undefined = desiredFolder.Name ?? undefined;
    if (!name) continue;

    const currentFolder: VirtualFolderInfoSchema | undefined =
      currentByName.get(name);
    if (!currentFolder) {
      toCreate.push(desiredFolder as VirtualFolderInfoSchema);
      continue;
    }

    const existingId: string | undefined = resolveFolderId(currentFolder);
    const libraryOptions: LibraryOptionsSchema | undefined =
      desiredFolder.LibraryOptions as LibraryOptionsSchema | undefined;
    if (!existingId || !libraryOptions) continue;
    if (
      !hasLibraryOptionsDiff(
        currentFolder.LibraryOptions as LibraryOptionsSchema | undefined,
        libraryOptions,
      )
    ) {
      continue;
    }

    toUpdate.push({
      id: existingId,
      name,
      libraryOptions,
    });
  }

  if (toCreate.length === 0 && toUpdate.length === 0) return undefined;

  return {
    toCreate: toCreate.length > 0 ? toCreate : undefined,
    toUpdate: toUpdate.length > 0 ? toUpdate : undefined,
  };
}

export async function applyLibrary(
  client: JellyfinClient,
  diffResult: LibraryDiff | undefined,
): Promise<void> {
  if (!diffResult) return;

  const { toCreate, toUpdate } = diffResult;

  if (!toCreate && !toUpdate) return;

  if (toCreate) {
    for (const virtualFolder of toCreate) {
      if (!virtualFolder.Name) {
        logger.warn("Skipping virtual folder without a Name");
        continue;
      }

      const name: string = virtualFolder.Name as string;
      const collectionType: CollectionTypeSchema =
        virtualFolder.CollectionType as CollectionTypeSchema;

      logger.info(`Creating virtual folder: ${name}`);

      const addVirtualFolderDto: AddVirtualFolderDtoSchema =
        mapVirtualFolderInfoSchemaToAddVirtualFolderDtoSchema(virtualFolder);

      await client.addVirtualFolder(name, collectionType, addVirtualFolderDto);

      logger.info(`✓ Created virtual folder: ${name} (${collectionType})`);
    }
  }

  if (toUpdate) {
    for (const update of toUpdate) {
      const payload: UpdateLibraryOptionsDtoSchema = {
        Id: update.id,
        LibraryOptions: update.libraryOptions,
      };

      logger.info(`Updating library options: ${update.name}`);
      await client.updateLibraryOptions(update.id, payload);
      logger.info(`✓ Updated library options: ${update.name}`);
    }
  }
}

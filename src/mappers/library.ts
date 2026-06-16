import type { VirtualFolderConfig } from "../types/config/library";
import type {
  LibraryOptionsSchema,
  VirtualFolderInfoSchema,
} from "../types/schema/library";

function omitUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => omitUndefined(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]: [string, unknown]) => entryValue !== undefined)
        .map(([key, entryValue]: [string, unknown]) => [
          key,
          omitUndefined(entryValue),
        ]),
    ) as T;
  }

  return value;
}

export function mapVirtualFolderConfigToSchema(
  config: VirtualFolderConfig,
): Partial<VirtualFolderInfoSchema> {
  return omitUndefined({
    Name: config.name,
    CollectionType: config.collectionType,
    LibraryOptions: {
      PathInfos: config.libraryOptions.pathInfos.map(
        (pathInfo: { path: string }) => ({
          Path: pathInfo.path,
        }),
      ),
      TypeOptions: config.libraryOptions.typeOptions,
      AutomaticallyAddToCollection:
        config.libraryOptions.automaticallyAddToCollection,
      EnableChapterImageExtraction:
        config.libraryOptions.enableChapterImageExtraction,
      ExtractChapterImagesDuringLibraryScan:
        config.libraryOptions.extractChapterImagesDuringLibraryScan,
      ExtractTrickplayImagesDuringLibraryScan:
        config.libraryOptions.extractTrickplayImagesDuringLibraryScan,
      EnableEmbeddedEpisodeInfos:
        config.libraryOptions.enableEmbeddedEpisodeInfos,
      EnableEmbeddedExtrasTitles:
        config.libraryOptions.enableEmbeddedExtraTitles,
      EnableTrickplayImageExtraction:
        config.libraryOptions.enableTrickplayImageExtraction,
      SaveLyricsWithMedia: config.libraryOptions.saveLyricsWithMedia,
      SaveTrickplayWithMedia: config.libraryOptions.saveTrickplayWithMedia,
      UseCustomTagDelimiters: config.libraryOptions.useCustomTagDelimiters,
      CustomTagDelimiters: config.libraryOptions.customTagDelimiters,
      DelimiterWhitelist: config.libraryOptions.delimiterWhitelist,
      MetadataSavers: config.libraryOptions.metadataSavers,
      SaveLocalMetadata: config.libraryOptions.saveLocalMetadata,
      AutomaticRefreshIntervalDays:
        config.libraryOptions.automaticRefreshIntervalDays,
      EnableRealtimeMonitor: config.libraryOptions.enableRealtimeMonitor,
    } as LibraryOptionsSchema,
  });
}

export function mapVirtualFolderInfoSchemaToAddVirtualFolderDtoSchema(
  virtualFolderInfoSchema: VirtualFolderInfoSchema,
): { LibraryOptions: VirtualFolderInfoSchema["LibraryOptions"] } {
  return {
    LibraryOptions: virtualFolderInfoSchema.LibraryOptions,
  };
}

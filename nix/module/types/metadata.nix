{lib}: let
  inherit (lib) types mkOption optionalAttrs;
  inherit (types) nullOr;

  metadataConfigType = types.submodule {
    options = {
      useFileCreationTimeForDateAdded = mkOption {
        type = nullOr types.bool;
        default = null;
        description = "Use the file creation time instead of the library scan time as the date media was added.";
      };
    };
  };

  mkMetadataConfig = cfg:
    {}
    // optionalAttrs (cfg.useFileCreationTimeForDateAdded != null) {
      inherit (cfg) useFileCreationTimeForDateAdded;
    };
in {
  inherit metadataConfigType mkMetadataConfig;
}

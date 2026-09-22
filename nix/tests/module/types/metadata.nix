{
  lib,
  assertEq,
  ...
}: let
  types = import ../../../module/types {inherit lib;};
  inherit (types.metadata) mkMetadataConfig;

  nullConfig = {useFileCreationTimeForDateAdded = null;};
in [
  (assertEq "empty config" (mkMetadataConfig nullConfig) {})

  (assertEq "use file creation time" (mkMetadataConfig (nullConfig
      // {useFileCreationTimeForDateAdded = true;})) {
    useFileCreationTimeForDateAdded = true;
  })

  (assertEq "use library scan time" (mkMetadataConfig (nullConfig
      // {useFileCreationTimeForDateAdded = false;})) {
    useFileCreationTimeForDateAdded = false;
  })
]

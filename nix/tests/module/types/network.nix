{
  lib,
  assertEq,
  ...
}: let
  types = import ../../../module/types {inherit lib;};
  inherit (types.network) mkNetworkConfig;

  nullConfig = {
    knownProxies = null;
  };
in [
  (assertEq "empty config" (mkNetworkConfig nullConfig) {})

  (assertEq "single known proxy" (mkNetworkConfig (nullConfig
    // {
      knownProxies = ["127.0.0.1"];
    })) {
    knownProxies = ["127.0.0.1"];
  })

  (assertEq "multiple known proxies" (mkNetworkConfig (nullConfig
    // {
      knownProxies = [
        "127.0.0.1"
        "10.0.0.2"
      ];
    })) {
    knownProxies = [
      "127.0.0.1"
      "10.0.0.2"
    ];
  })
]

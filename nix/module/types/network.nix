{lib}: let
  inherit (lib) types mkOption optionalAttrs;
  inherit (types) nullOr;

  networkConfigType = types.submodule {
    options = {
      knownProxies = mkOption {
        type = nullOr (types.listOf types.str);
        default = null;
        description = "List of trusted reverse proxy IP addresses.";
      };
    };
  };

  mkNetworkConfig = cfg:
    {}
    // optionalAttrs (cfg.knownProxies != null) {inherit (cfg) knownProxies;};
in {
  inherit networkConfigType mkNetworkConfig;
}

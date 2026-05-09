{pkgs}: let
  tests = [
    "sanity"
    "library-update"
  ];
in
  builtins.listToAttrs (map (name: {
      inherit name;
      value = import ./${name}.nix {inherit pkgs;};
    })
    tests)

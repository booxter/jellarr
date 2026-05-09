{pkgs}:
pkgs.testers.runNixOSTest {
  extraPythonPackages = p: [p.pyhamcrest];

  globalTimeout = 600;

  name = "jellarr-library-update-existing-option";

  nodes.server = {
    imports = [
      ./base.nix
    ];

    services.jellarr.config = {
      base_url = "http://localhost:8096";
      library = {
        virtualFolders = [
          {
            collectionType = "movies";
            libraryOptions = {
              pathInfos = [
                {path = "/mnt/movies/English";}
              ];
            };
            name = "test-jellarr";
          }
        ];
      };
      system = {};
      version = 1;
    };
  };

  testScript =
    # py
    ''
      ${builtins.readFile ./library-update.py}
      run_library_update_test(server)
    '';
}

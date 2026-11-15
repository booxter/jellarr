import json
import time

from hamcrest import all_of, assert_that, has_entry, has_item, has_length


def wait_for_bootstrap(server):
    print("=== Starting the VM / Server ===")
    server.start()

    print("=== Waiting for API key bootstrap service ===")
    server.wait_until_succeeds(
        "systemctl show jellarr-api-key-bootstrap.service --property=ActiveState,Result | grep -q 'ActiveState=inactive' && systemctl show jellarr-api-key-bootstrap.service --property=Result | grep -q 'Result=success'"
    )
    print("✓ Bootstrap service completed successfully")

    server.wait_for_unit("jellyfin.service")
    server.wait_for_open_port(8096)

    print("=== Waiting for authenticated API ===")
    # The public listener starts before Jellyfin finishes its FFmpeg probes.
    server.wait_until_succeeds(
        "curl --max-time 5 -sf 'http://localhost:8096/System/Configuration' -H 'X-Emby-Token: test-api-key'",
        timeout=180,
    )


def jellyfin_api_call(server, endpoint, method="GET", data=None):
    url = f"http://localhost:8096{endpoint}"
    cmd = f"curl -sf '{url}' -H 'X-Emby-Token: test-api-key'"

    if method == "POST":
        cmd += " -H 'Content-Type: application/json'"
        if data:
            cmd += f" -d '{data}'"

    result = server.succeed(cmd)
    return json.loads(result)


def get_jellyfin_data(server, endpoint):
    return jellyfin_api_call(server, endpoint)


def wait_for_machine(server):
    server.wait_for_unit("multi-user.target")


def validate_library_configuration(
    server, save_trickplay_with_media, language, country, save_subtitles
):
    virtual_folders = get_jellyfin_data(server, "/Library/VirtualFolders")

    assert_that(
        virtual_folders,
        all_of(
            has_length(1),
            has_item(
                all_of(
                    has_entry("CollectionType", "movies"),
                    has_entry("Name", "test-jellarr"),
                    has_entry(
                        "LibraryOptions",
                        has_entry(
                            "PathInfos",
                            all_of(
                                has_length(1),
                                has_item(has_entry("Path", "/mnt/movies/English")),
                            ),
                        ),
                    ),
                )
            ),
        ),
    )

    library_folder = virtual_folders[0]
    options = library_folder["LibraryOptions"]
    assert options["PreferredMetadataLanguage"] == language
    assert options["MetadataCountryCode"] == country
    assert options["SaveSubtitlesWithMedia"] is save_subtitles
    if save_trickplay_with_media:
        assert library_folder["LibraryOptions"].get("SaveTrickplayWithMedia") is True
    else:
        assert library_folder["LibraryOptions"].get("SaveTrickplayWithMedia") in (
            None,
            False,
        )

    print(
        f"✓ Library configuration validated (SaveTrickplayWithMedia={save_trickplay_with_media})"
    )


def setup_files_and_folders(server):
    server.succeed("mkdir -p /mnt/movies/English")


def write_updated_library_config(server):
    server.succeed(
        """cat > /tmp/jellarr-update-config.yml <<'EOF'
version: 1
base_url: http://localhost:8096
system: {}
library:
  virtualFolders:
    - collectionType: movies
      libraryOptions:
        pathInfos:
          - path: /mnt/movies/English
        saveTrickplayWithMedia: true
        preferredMetadataLanguage: ru
        metadataCountryCode: RU
        saveSubtitlesWithMedia: false
      name: test-jellarr
EOF"""
    )


def run_manual_apply(server, config_path):
    jellarr_bin = server.succeed(
        "systemctl cat jellarr.service | sed -n 's/^ExecStart=//p'"
    ).strip()
    server.succeed(
        f"cd /var/lib/jellarr && JELLARR_API_KEY=test-api-key {jellarr_bin} apply --configFile {config_path}"
    )


def run_library_update_test(server):
    wait_for_machine(server)
    wait_for_bootstrap(server)
    setup_files_and_folders(server)

    server.succeed("systemctl start jellarr.service")
    time.sleep(10)
    server.succeed(
        "systemctl show jellarr.service --property=ExecMainStatus | grep -q 'ExecMainStatus=0'"
    )

    validate_library_configuration(server, False, "en", "US", True)
    write_updated_library_config(server)
    run_manual_apply(server, "/tmp/jellarr-update-config.yml")
    validate_library_configuration(server, True, "ru", "RU", False)
    run_manual_apply(server, "/tmp/jellarr-update-config.yml")
    validate_library_configuration(server, True, "ru", "RU", False)

    print("✅ LIBRARY UPDATE test passed")

import {
  createServer,
  type Server,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import type { AddressInfo } from "node:net";
import { once } from "node:events";
import { describe, expect, it } from "vitest";
import { createJellyfinClient } from "../../src/api/jellyfin_client";
import type { JellyfinClient } from "../../src/api/jellyfin.types";
import type { UserConfigurationSchema } from "../../src/types/schema/users";

interface ConfigurationRequest {
  method?: string;
  url?: string;
  body: unknown;
}

describe("user configuration API", () => {
  it.each([204, 400])(
    "handles a server response of %i",
    async (status: number) => {
      const requests: ConfigurationRequest[] = [];
      const server: Server = createServer(
        (request: IncomingMessage, response: ServerResponse) => {
          const chunks: string[] = [];
          request.setEncoding("utf8");
          request.on("data", (chunk: string) => {
            chunks.push(chunk);
          });
          request.on("end", () => {
            requests.push({
              method: request.method,
              url: request.url,
              body: JSON.parse(chunks.join("")),
            });
            response.writeHead(status);
            response.end();
          });
        },
      );
      server.listen(0, "127.0.0.1");
      await once(server, "listening");

      try {
        const address: AddressInfo | string | null = server.address();
        if (address === null || typeof address === "string") {
          throw new Error("Expected a TCP listener");
        }

        const client: JellyfinClient = createJellyfinClient(
          `http://127.0.0.1:${address.port.toString()}`,
          "test-key",
        );
        const configuration: UserConfigurationSchema = {
          SubtitleLanguagePreference: "rus",
        };
        const update: Promise<void> = client.updateUserConfiguration(
          "viewer",
          configuration,
        );

        if (status === 204) {
          await expect(update).resolves.toBeUndefined();
        } else {
          await expect(update).rejects.toThrow(
            "POST /Users/Configuration failed: 400",
          );
        }

        expect(requests).toEqual([
          {
            method: "POST",
            url: "/Users/Configuration?userId=viewer",
            body: configuration,
          },
        ]);
      } finally {
        await server[Symbol.asyncDispose]();
      }
    },
  );
});

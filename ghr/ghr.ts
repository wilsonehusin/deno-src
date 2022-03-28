import { serve } from "std/http/server.ts";
import { VERSION } from "std/version.ts";
import * as log from "std/log/mod.ts";

import { getReleases } from "./github/mod.ts";
import { releasesVersionTree } from "./releaseversion.ts";

const headers: Record<string, string> = {
  "content-type": "application/json",
};

if (Deno.version !== undefined) {
  headers["x-deno"] = Deno.version.deno;
  headers["x-deno-v8"] = Deno.version.v8;
  headers["x-deno-ts"] = Deno.version.typescript;
}

headers["x-deno-std"] = VERSION;

const region = Deno.env.get("DENO_REGION");
if (region) {
  headers["x-deno-region"] = region;
}

let loglevel: "DEBUG" | "INFO" = "DEBUG";
if (region) {
  loglevel = "INFO";
}

await log.setup({
  handlers: {
    default: new log.handlers.ConsoleHandler(loglevel),
  },
  loggers: {
    default: {
      level: loglevel,
      handlers: ["default"],
    },
    github: {
      level: loglevel,
      handlers: ["default"],
    },
    stats: {
      level: loglevel,
      handlers: ["default"],
    },
    cache: {
      level: loglevel,
      handlers: ["default"],
    },
  },
});

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const releases = await getReleases({ path: url.pathname });
  const versionTree = releasesVersionTree(releases);
  return new Response(JSON.stringify(versionTree), { headers });
}

log.info({ port: 8000 });
serve(handler);

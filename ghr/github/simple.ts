import { getReleases } from "./client.ts";
import * as log from "std/log/mod.ts";

await log.setup({
  handlers: {
    default: new log.handlers.ConsoleHandler("DEBUG"),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["default"],
    },
    github: {
      level: "DEBUG",
      handlers: ["default"],
    },
    stats: {
      level: "DEBUG",
      handlers: ["default"],
    },
    cache: {
      level: "DEBUG",
      handlers: ["default"],
    },
  },
});

const repository = "xargs-dev/archy";
const releases = await getReleases({ path: repository });

console.log({ repository, releases });

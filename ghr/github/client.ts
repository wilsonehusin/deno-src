import { join } from "std/path/mod.ts";
import * as log from "std/log/mod.ts";
import { connect, parseURL } from "redis/mod.ts";

const redis = await connect(parseURL(Deno.env.get("REDIS_URL") || ""));

export async function getReleases({
  path = "",
  host = "https://api.github.com",
  per_page = 30,
  page = 1,
}): Promise<GitHubRelease[]> {
  const logger = log.getLogger("github");
  if (!path) {
    logger.error({ path, msg: "malformed path, expected: owner/repo" });
    return [];
  }
  path = normalizePath(path);
  const p = {
    per_page: per_page.toString(),
    page: page.toString(),
  };
  const params = new URLSearchParams(p).toString();
  let url = join(host, "repos", path, "releases");
  if (params !== "") {
    url += "?" + params;
  }

  const cache = await cacheGet(url);

  logger.debug({ url, etag: cache.etag });

  const resp = await fetch(url, {
    headers: {
      "user-agent": "ghr.deno.dev",
      "x-source-code": "https://github.com/wilsonehusin/deno-src/tree/main/ghr",
      "if-none-match": cache.etag,
    },
  });

  log.getLogger("stats").info(() => parseHeaders(resp.headers));

  if (resp.status == 304) {
    logger.debug({ url, fromCache: true });
    return cache.releases;
  }

  if (!resp.ok) {
    const body = await resp.text();
    logger.error({
      url,
      body,
      status: { code: resp.status, text: resp.statusText },
    });
    return [];
  }

  logger.debug({ url, status: { code: resp.status, text: resp.statusText } });
  const data = await resp.json();

  const result = data.map((v: GitHubResponse) => {
    return {
      host,
      path,

      id: v.id,
      git_tag: v.tag_name,
      name: v.name,

      prerelease: v.prerelease,
      draft: v.draft,

      created_at: v.created_at,
      published_at: v.published_at,
    };
  });

  const etag = resp.headers.get("etag") || "";
  cacheSet(url, etag, result).then((v: string) => {
    if (v == "OK") {
      log.getLogger("cache").info({ cache: { set: etag }, status: v });
    } else {
      log.getLogger("cache").warning({ cache: { set: etag }, status: v });
    }
  }).catch((reason) => {
    log.getLogger("cache").error({
      cache: { set: etag },
      reason: reason.toString(),
    });
  });

  logger.debug({ url, fromCache: false });
  return result;
}

function parseHeaders(headers: Headers): unknown {
  return {
    github: {
      ratelimit: {
        limit: headers.get("x-ratelimit-limit"),
        remaining: headers.get("x-ratelimit-remaining"),
        resource: headers.get("x-ratelimit-resource"),
        used: headers.get("x-ratelimit-used"),
        reset: headers.get("x-ratelimit-reset"),
      },
      "request-id": headers.get("x-github-request-id"),
      "etag": headers.get("etag"),
    },
  };
}

export interface GitHubRelease {
  host: string;
  path: string;

  id: number;
  git_tag: string;
  name: string;

  prerelease: boolean;
  draft: boolean;

  created_at: string;
  published_at: string;
}

interface GitHubResponse {
  id: string;
  tag_name: string;
  name: string;

  prerelease: boolean;
  draft: boolean;

  created_at: string;
  published_at: string;
}

interface CacheEntry {
  etag: string;
  releases: GitHubRelease[];
}

function normalizePath(path: string): string {
  let result = path;
  if (result.charAt(0) == "/") result = result.slice(1);
  if (result.charAt(result.length - 1) == "/") {
    result = result.slice(0, result.length - 1);
  }
  return result;
}

async function cacheGet(key: string): Promise<CacheEntry> {
  const raw = await redis.get(key);
  let result: CacheEntry = {
    etag: "",
    releases: [],
  };
  if (raw === undefined) {
    return result;
  }
  try {
    result = JSON.parse(raw);
    log.getLogger("cache").info({ cache: { get: key }, hit: true });
    return result;
  } catch (reason) {
    log.getLogger("cache").error({
      cache: { get: key },
      hit: false,
      reason: reason.toString(),
    });
    return {
      etag: "",
      releases: [],
    };
  }
}

function cacheSet(
  key: string,
  etag: string,
  releases: GitHubRelease[],
): Promise<string> {
  if (etag === undefined || etag == "") {
    throw "Invalid ETag";
  }
  return redis.set(key, JSON.stringify({ etag, releases }));
}

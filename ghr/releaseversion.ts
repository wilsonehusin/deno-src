import { GitHubRelease } from "./github/mod.ts";
import "lodash/dist/lodash.min.js";
// deno-lint-ignore no-explicit-any
const _ = (self as any)._;

export type VersionTree = {
  [key: string]: VersionTree | Release | Record<never, never>;
};

export type Release = {
  version: string;
  host: string;
  path: string;
  id: string;
};

export function releasesVersionTree(releases: GitHubRelease[]): VersionTree {
  let tree = {};

  releases.forEach((release: GitHubRelease) => {
    tree = buildTree(tree, release);
  });
  console.log(tree);
  return tree;
}

function buildTree(tree: VersionTree, release: GitHubRelease): VersionTree {
  const name = release.git_tag.charAt(0) == "v"
    ? release.git_tag.slice(1)
    : release.git_tag;

  let key = "[";
  for (let i = 0; i < name.length; i++) {
    const c = name.charAt(i);

    if (c == "." || c == "-" || c == "+" || c == "_") {
      if (i == name.length - 1) {
        continue;
      }
      key += "][";
      continue;
    }

    key += c;
  }
  key += "]";

  return _.setWith(tree, key, {"_release": release}, Object);
}

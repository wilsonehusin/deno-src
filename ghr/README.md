# `ghr` — GitHub Releases ([live](https://ghr.deno.dev/kubernetes/kubernetes))

`ghr` is an API that assumes GitHub releases to be semantic versioned, returning
releases in a tree of `major`.`minor`.`patch`.

At the time of writing,
[GitHub API only support listing and getting latest](https://docs.github.com/en/rest/reference/releases).
However, latest release is not always the release channel that you would want.

For example, a project has releases as such, sorted from newest to oldest:

- `v1.20.5`
- `v1.21.2`
- `v1.20.4`
- `v1.19.8`

GitHub's "latest" API would return `v1.20.5`, but it would be a downgrade if
you're already on `v1.21.2`, right?

## Usage

### `GET /{owner}/{repository}`

Get all releases leveled with semantic versioning.

```json
{
  "1": {
    "20": {
      "4": {
        "_release": {
          "id": "42"
        },
        "beta": {
          "1": {
            "_release": {
              "id": "41"
            }
          }
        }
      }
    }
  }
}
```

# Modrinth API v2 Documentation

> Reference documentation for the Modrinth API v2 (Labrinth), focused on mod version checking use cases.
>
> Official docs: https://docs.modrinth.com/api/
> OpenAPI spec: https://docs.modrinth.com/openapi.yaml

---

## Table of Contents

- [Base URL and Authentication](#base-url-and-authentication)
- [User-Agent Requirement](#user-agent-requirement)
- [Rate Limits](#rate-limits)
- [Resource Identifiers](#resource-identifiers)
- [Endpoints](#endpoints)
  - [Search Projects](#1-search-projects)
  - [Get Project](#2-get-project)
  - [Get Multiple Projects](#3-get-multiple-projects)
  - [List Project Versions](#4-list-project-versions)
  - [Get Version by ID or Number](#5-get-version-by-id-or-number)
  - [Get Multiple Versions](#6-get-multiple-versions)
  - [Get Version from File Hash](#7-get-version-from-file-hash)
  - [Get Latest Version from Hash](#8-get-latest-version-from-hash)
  - [Get Latest Versions from Multiple Hashes](#9-get-latest-versions-from-multiple-hashes)
- [Tag Endpoints](#tag-endpoints)
  - [List Game Versions](#list-game-versions)
  - [List Loaders](#list-loaders)
- [Error Handling](#error-handling)
- [Usage Notes and Caveats](#usage-notes-and-caveats)

---

## Base URL and Authentication

### Base URLs

| Environment | URL                                    |
|-------------|----------------------------------------|
| Production  | `https://api.modrinth.com/v2`          |
| Staging     | `https://staging-api.modrinth.com/v2`  |

### Authentication

**Authentication is NOT required for reading public data** (searching projects, fetching versions, etc.). This is the main advantage over CurseForge, which requires an API key for all requests.

For authenticated requests (higher rate limits, access to private projects):

```
Authorization: mrp_YOUR_PERSONAL_ACCESS_TOKEN
```

Token types:
- **Personal Access Tokens (PATs)**: Recommended. Generated from Modrinth account settings.
- **OAuth2**: For applications acting on behalf of users.
- **GitHub tokens**: Deprecated, will stop working in API v3.

### Health Check

```
GET https://api.modrinth.com/v2
```

Response:
```json
{
  "about": "Welcome traveler!",
  "documentation": "https://docs.modrinth.com",
  "name": "modrinth-labrinth",
  "version": "2.7.0"
}
```

---

## User-Agent Requirement

A uniquely-identifying `User-Agent` header is **required** for all requests. Generic user agents (e.g., `okhttp/4.9.3`) may result in blocked traffic.

Recommended format:

```
User-Agent: github_username/project_name/version (contact@email.com)
```

Example:

```
User-Agent: myuser/minecraft-mod-checker/1.0.0 (myuser@example.com)
```

---

## Rate Limits

- **Limit**: 300 requests per minute per IP address
- Authenticated requests may receive higher limits
- Contact `admin@modrinth.com` for increased limits

### Response Headers

| Header                  | Description                          |
|-------------------------|--------------------------------------|
| `X-Ratelimit-Limit`    | Maximum requests per minute          |
| `X-Ratelimit-Remaining`| Requests remaining in current window |
| `X-Ratelimit-Reset`    | Seconds until the limit resets       |

---

## Resource Identifiers

- All resources use **8-digit base62 IDs** (e.g., `AABBCCDD`).
- **Projects** can be identified by ID or **slug** (vanity URL name).
- **Versions** are identified by ID only (but can be looked up by version number via a specific endpoint).
- **Slugs can change** -- for long-term storage, always use the numeric ID.

---

## Endpoints

### 1. Search Projects

Search for mods, modpacks, resource packs, and shaders.

```
GET /search
```

#### Query Parameters

| Parameter | Type    | Default     | Description                                            |
|-----------|---------|-------------|--------------------------------------------------------|
| `query`   | string  | --          | Search query (e.g., `"sodium"`)                        |
| `facets`  | string  | --          | JSON array of facet filters (see below)                |
| `index`   | string  | `relevance` | Sort: `relevance`, `downloads`, `follows`, `newest`, `updated` |
| `offset`  | integer | `0`         | Number of results to skip (for pagination)             |
| `limit`   | integer | `10`        | Results per page (max: **100**)                        |

#### Facets

Facets filter search results. Format: `{type}{operation}{value}`

**Operators**: `:` (equals), `!=`, `>=`, `>`, `<=`, `<`

**Common facet types**:
- `project_type` -- `mod`, `modpack`, `resourcepack`, `shader`
- `categories` -- loader or category name (e.g., `forge`, `fabric`, `adventure`)
- `versions` -- Minecraft version (e.g., `1.20.1`)
- `client_side` / `server_side` -- `required`, `optional`, `unsupported`
- `license` -- SPDX license ID
- `title`, `author`, `project_id`
- `downloads`, `follows`
- `open_source` -- boolean
- `created_timestamp`, `modified_timestamp` -- Unix timestamp
- `date_created`, `date_modified` -- ISO-8601

**Logic**:
- **OR**: Elements in the same inner array
- **AND**: Separate inner arrays

**Example**: Search for Fabric mods compatible with Minecraft 1.20.1:

```
GET /search?query=sodium&facets=[["categories:fabric"],["versions:1.20.1"],["project_type:mod"]]
```

**Example**: Mods for either 1.20.1 OR 1.20.4 (OR logic):

```
GET /search?query=sodium&facets=[["versions:1.20.1","versions:1.20.4"],["project_type:mod"]]
```

#### Response

```json
{
  "hits": [
    {
      "project_id": "AANobbMI",
      "slug": "sodium",
      "title": "Sodium",
      "description": "The fastest and most compatible rendering optimization mod for Minecraft",
      "author": "jellysquid3",
      "project_type": "mod",
      "categories": ["fabric", "optimization"],
      "display_categories": ["fabric", "optimization"],
      "versions": ["1.19", "1.19.1", "1.19.2", "1.20.1"],
      "latest_version": "1.20.1",
      "downloads": 50000000,
      "follows": 250000,
      "client_side": "required",
      "server_side": "unsupported",
      "license": "LGPL-3.0-only",
      "icon_url": "https://cdn.modrinth.com/data/AANobbMI/icon.png",
      "color": 16742912,
      "gallery": [],
      "featured_gallery": null,
      "date_created": "2021-01-03T05:00:00Z",
      "date_modified": "2024-01-15T12:00:00Z",
      "monetization_status": "monetized"
    }
  ],
  "offset": 0,
  "limit": 10,
  "total_hits": 1
}
```

#### Pagination

Use `offset` and `limit` to paginate. The `total_hits` field tells you how many results exist.

```python
# Page 1: offset=0, limit=20
# Page 2: offset=20, limit=20
# Page 3: offset=40, limit=20
# ...
```

---

### 2. Get Project

Get detailed information about a single project by ID or slug.

```
GET /project/{id|slug}
```

#### Path Parameters

| Parameter  | Type   | Description                      |
|------------|--------|----------------------------------|
| `id\|slug` | string | Project ID or slug (e.g., `"sodium"` or `"AANobbMI"`) |

#### Response (200)

```json
{
  "id": "AANobbMI",
  "slug": "sodium",
  "title": "Sodium",
  "description": "The fastest and most compatible rendering optimization mod for Minecraft",
  "body": "# Sodium\n\nLong-form markdown description...",
  "project_type": "mod",
  "categories": ["fabric", "optimization"],
  "additional_categories": [],
  "client_side": "required",
  "server_side": "unsupported",
  "status": "approved",
  "downloads": 50000000,
  "followers": 250000,
  "icon_url": "https://cdn.modrinth.com/data/AANobbMI/icon.png",
  "color": 16742912,
  "team": "UUVVWWXX",
  "versions": ["IIJJKKLL", "MMNNOOPP", "QQRRSSTT"],
  "game_versions": ["1.19", "1.19.1", "1.19.2", "1.20.1"],
  "loaders": ["fabric", "quilt"],
  "license": {
    "id": "LGPL-3.0-only",
    "name": "GNU Lesser General Public License v3.0 only",
    "url": "https://cdn.modrinth.com/licenses/lgpl-3.0-only.txt"
  },
  "issues_url": "https://github.com/CaffeineMC/sodium-fabric/issues",
  "source_url": "https://github.com/CaffeineMC/sodium-fabric",
  "wiki_url": null,
  "discord_url": "https://discord.gg/example",
  "donation_urls": [],
  "published": "2021-01-03T05:00:00Z",
  "updated": "2024-01-15T12:00:00Z",
  "approved": "2021-01-03T06:00:00Z",
  "gallery": []
}
```

**Key fields for version checking**:
- `versions` -- array of version IDs (use with [Get Multiple Versions](#6-get-multiple-versions))
- `game_versions` -- all supported Minecraft versions across all mod versions
- `loaders` -- all supported loaders across all mod versions

---

### 3. Get Multiple Projects

Fetch multiple projects in a single request (batch lookup).

```
GET /projects?ids=["AABBCCDD","EEFFGGHH"]
```

#### Query Parameters

| Parameter | Type   | Description                                     |
|-----------|--------|-------------------------------------------------|
| `ids`     | string | JSON array of project IDs and/or slugs          |

#### Response (200)

Returns an array of project objects (same schema as [Get Project](#2-get-project)).

---

### 4. List Project Versions

**Primary endpoint for version checking.** Returns all versions for a project with optional filtering.

```
GET /project/{id|slug}/version
```

#### Path Parameters

| Parameter  | Type   | Description               |
|------------|--------|---------------------------|
| `id\|slug` | string | Project ID or slug        |

#### Query Parameters

| Parameter           | Type    | Default | Description                                      |
|---------------------|---------|---------|--------------------------------------------------|
| `loaders`           | string  | --      | JSON array of loaders (e.g., `["fabric"]`)       |
| `game_versions`     | string  | --      | JSON array of game versions (e.g., `["1.20.1"]`) |
| `featured`          | boolean | --      | Filter by featured status                        |
| `include_changelog` | boolean | `true`  | Include changelog in response                    |

**Important**: The `loaders` and `game_versions` parameters are JSON-encoded string arrays, not repeated query parameters.

#### Examples

Get all Fabric versions for Minecraft 1.20.1:

```
GET /project/sodium/version?loaders=["fabric"]&game_versions=["1.20.1"]
```

Get all versions for multiple game versions:

```
GET /project/sodium/version?game_versions=["1.20.1","1.20.4"]
```

Get only featured (stable/recommended) versions:

```
GET /project/sodium/version?featured=true
```

#### Response (200)

Returns an array of version objects, **sorted by date_published descending** (newest first).

```json
[
  {
    "id": "IIJJKKLL",
    "project_id": "AANobbMI",
    "author_id": "EEFFGGHH",
    "name": "Sodium 0.5.8",
    "version_number": "mc1.20.4-0.5.8",
    "changelog": "## Changes\n- Fixed rendering bug\n- Performance improvements",
    "dependencies": [
      {
        "version_id": null,
        "project_id": "P7dR8mSH",
        "file_name": null,
        "dependency_type": "required"
      }
    ],
    "game_versions": ["1.20.4"],
    "version_type": "release",
    "loaders": ["fabric"],
    "featured": true,
    "status": "listed",
    "requested_status": null,
    "date_published": "2024-01-15T12:00:00Z",
    "downloads": 500000,
    "changelog_url": null,
    "files": [
      {
        "hashes": {
          "sha512": "93ecf5fe02914fb53d94aa3d28c1fb562e23985f...",
          "sha1": "c84dd4b3580c02b79958a0590afd5783d80ef504"
        },
        "url": "https://cdn.modrinth.com/data/AANobbMI/versions/IIJJKKLL/sodium-fabric-0.5.8+mc1.20.4.jar",
        "filename": "sodium-fabric-0.5.8+mc1.20.4.jar",
        "primary": true,
        "size": 1097270,
        "file_type": null
      }
    ]
  }
]
```

**No pagination** -- this endpoint returns ALL matching versions. For projects with many versions, use the filter parameters to reduce the response.

#### Version Object Fields

| Field              | Type           | Required | Description                                                    |
|--------------------|----------------|----------|----------------------------------------------------------------|
| `id`               | string         | Yes      | Version ID (base62)                                            |
| `project_id`       | string         | Yes      | Parent project ID                                              |
| `author_id`        | string         | Yes      | Publisher user ID                                               |
| `name`             | string         | No       | Human-readable version name                                    |
| `version_number`   | string         | No       | Version number (ideally semver)                                |
| `changelog`        | string/null    | No       | Markdown changelog                                             |
| `dependencies`     | array          | No       | List of dependency objects                                     |
| `game_versions`    | array\<string> | No       | Supported Minecraft versions                                   |
| `version_type`     | string         | No       | `release`, `beta`, or `alpha`                                  |
| `loaders`          | array\<string> | No       | Supported mod loaders                                          |
| `featured`         | boolean        | No       | Whether marked as featured/recommended                         |
| `status`           | string         | No       | `listed`, `archived`, `draft`, `unlisted`, `scheduled`, `unknown` |
| `date_published`   | string         | Yes      | ISO-8601 publication timestamp                                 |
| `downloads`        | integer        | Yes      | Download count for this version                                |
| `files`            | array          | Yes      | Downloadable files (see below)                                 |

#### Dependency Object

| Field             | Type        | Required | Description                                              |
|-------------------|-------------|----------|----------------------------------------------------------|
| `version_id`      | string/null | No       | Specific version ID of the dependency                    |
| `project_id`      | string/null | No       | Project ID of the dependency                             |
| `file_name`       | string/null | No       | File name (used for external deps in modpacks)           |
| `dependency_type`  | string      | Yes      | `required`, `optional`, `incompatible`, `embedded`       |

#### File Object

| Field      | Type        | Required | Description                                                                 |
|------------|-------------|----------|-----------------------------------------------------------------------------|
| `hashes`   | object      | Yes      | `{ "sha1": "...", "sha512": "..." }`                                        |
| `url`      | string      | Yes      | Direct CDN download link                                                    |
| `filename` | string      | Yes      | File name                                                                   |
| `primary`  | boolean     | Yes      | Whether this is the primary file (max one per version)                      |
| `size`     | integer     | Yes      | File size in bytes                                                          |
| `file_type`| string/null | No       | Additional type: `required-resource-pack`, `optional-resource-pack`, `sources-jar`, `dev-jar`, `javadoc-jar`, `signature`, `unknown` |

---

### 5. Get Version by ID or Number

Look up a specific version using its ID or version number string.

```
GET /project/{id|slug}/version/{id|number}
```

#### Path Parameters

| Parameter    | Type   | Description                             |
|--------------|--------|-----------------------------------------|
| `id\|slug`   | string | Project ID or slug                      |
| `id\|number` | string | Version ID or version number string     |

#### Response (200)

Returns a single version object (same schema as in [List Project Versions](#4-list-project-versions)).

---

### 6. Get Multiple Versions

Fetch multiple version objects by their IDs in a single request.

```
GET /versions?ids=["AABBCCDD","EEFFGGHH"]
```

#### Query Parameters

| Parameter | Type   | Description                    |
|-----------|--------|--------------------------------|
| `ids`     | string | JSON array of version IDs      |

#### Response (200)

Returns an array of version objects (same schema as in [List Project Versions](#4-list-project-versions)).

---

### 7. Get Version from File Hash

Look up which version a specific file belongs to using its SHA-1 or SHA-512 hash.

```
GET /version_file/{hash}
```

#### Path Parameters

| Parameter | Type   | Description                             |
|-----------|--------|-----------------------------------------|
| `hash`    | string | Hex-encoded file hash                   |

#### Query Parameters

| Parameter   | Type    | Default | Description                             |
|-------------|---------|---------|------------------------------------------|
| `algorithm` | string  | `sha1`  | Hash algorithm: `sha1` or `sha512`       |
| `multiple`  | boolean | --      | Return multiple results for this hash    |

#### Response (200)

Returns a single version object (same schema as in [List Project Versions](#4-list-project-versions)).

---

### 8. Get Latest Version from Hash

Given a file hash, find the latest version of the same project filtered by loader and game version. Useful for "check for updates" functionality.

```
POST /version_file/{hash}/update
```

#### Path Parameters

| Parameter | Type   | Description             |
|-----------|--------|-------------------------|
| `hash`    | string | Hex-encoded file hash   |

#### Query Parameters

| Parameter   | Type   | Default | Description                        |
|-------------|--------|---------|------------------------------------|
| `algorithm` | string | `sha1`  | Hash algorithm: `sha1` or `sha512` |

#### Request Body (JSON)

```json
{
  "loaders": ["fabric"],
  "game_versions": ["1.20.1", "1.20.4"]
}
```

| Field           | Type           | Required | Description                  |
|-----------------|----------------|----------|------------------------------|
| `loaders`       | array\<string> | Yes      | Mod loaders to filter by     |
| `game_versions` | array\<string> | Yes      | Game versions to filter by   |

#### Response (200)

Returns a single version object (same schema as in [List Project Versions](#4-list-project-versions)).

Returns 404 if no matching version is found.

---

### 9. Get Latest Versions from Multiple Hashes

Bulk version of the above. Given multiple file hashes, find the latest version for each.

```
POST /version_files/update
```

#### Request Body (JSON)

```json
{
  "hashes": [
    "c84dd4b3580c02b79958a0590afd5783d80ef504",
    "a1b2c3d4e5f6..."
  ],
  "algorithm": "sha1",
  "loaders": ["fabric"],
  "game_versions": ["1.20.1"]
}
```

| Field           | Type           | Required | Description                        |
|-----------------|----------------|----------|------------------------------------|
| `hashes`        | array\<string> | Yes      | Hex-encoded file hashes            |
| `algorithm`     | string         | Yes      | `sha1` or `sha512`                 |
| `loaders`       | array\<string> | Yes      | Mod loaders to filter by           |
| `game_versions` | array\<string> | Yes      | Game versions to filter by         |

#### Response (200)

Returns a **map** where keys are input hashes and values are version objects:

```json
{
  "c84dd4b3580c02b79958a0590afd5783d80ef504": {
    "id": "IIJJKKLL",
    "project_id": "AABBCCDD",
    "version_number": "1.2.0",
    "game_versions": ["1.20.1"],
    "loaders": ["fabric"],
    "files": [...]
  },
  "a1b2c3d4e5f6...": {
    ...
  }
}
```

Hashes with no matching version are omitted from the response (not included as null).

---

## Tag Endpoints

These endpoints provide the valid values for game versions and loaders. Useful for populating UI dropdowns or validating user input.

### List Game Versions

```
GET /tag/game_version
```

Returns an array of all known Minecraft versions:

```json
[
  {
    "version": "1.21.4",
    "version_type": "release",
    "date": "2024-12-03T00:00:00Z",
    "major": true
  },
  {
    "version": "1.21.4-pre1",
    "version_type": "snapshot",
    "date": "2024-11-20T00:00:00Z",
    "major": false
  },
  {
    "version": "24w44a",
    "version_type": "snapshot",
    "date": "2024-10-30T00:00:00Z",
    "major": false
  }
]
```

| Field          | Type    | Description                                           |
|----------------|---------|-------------------------------------------------------|
| `version`      | string  | Version name/number (e.g., `"1.20.1"`)                |
| `version_type` | string  | `release`, `snapshot`, `alpha`, `beta`                 |
| `date`         | string  | ISO-8601 release date                                  |
| `major`        | boolean | Whether this is a major version (used for "Featured") |

### List Loaders

```
GET /tag/loader
```

Returns an array of all known mod loaders:

```json
[
  {
    "icon": "<svg>...</svg>",
    "name": "fabric",
    "supported_project_types": ["mod", "modpack"]
  },
  {
    "icon": "<svg>...</svg>",
    "name": "forge",
    "supported_project_types": ["mod", "modpack"]
  },
  {
    "icon": "<svg>...</svg>",
    "name": "neoforge",
    "supported_project_types": ["mod", "modpack"]
  },
  {
    "icon": "<svg>...</svg>",
    "name": "quilt",
    "supported_project_types": ["mod", "modpack"]
  }
]
```

| Field                     | Type           | Description                          |
|---------------------------|----------------|--------------------------------------|
| `icon`                    | string         | SVG icon markup                      |
| `name`                    | string         | Loader identifier                    |
| `supported_project_types` | array\<string> | Project types this loader supports   |

---

## Error Handling

### HTTP Status Codes

| Code | Meaning                                                        |
|------|----------------------------------------------------------------|
| 200  | Success                                                        |
| 400  | Invalid request (bad parameters, malformed JSON)               |
| 401  | Authentication required or invalid token/scope                 |
| 404  | Resource not found or no authorization to access it            |
| 410  | API version permanently deprecated                             |
| 429  | Rate limit exceeded                                            |

### Error Response Format

```json
{
  "error": "invalid_input",
  "description": "Error information relevant to the request"
}
```

### 410 Gone -- API Deprecation

When an API version is fully deprecated, all endpoints permanently return 410. Applications should handle this by notifying the user to update. The current version is v2; when v3 becomes available, v2 will eventually be sunset.

---

## Usage Notes and Caveats

### Recommended Strategy for Mod Version Checking

1. **By project slug/ID** (simplest):
   - Use `GET /project/{slug}/version?loaders=["fabric"]&game_versions=["1.20.1"]` to get filtered versions.
   - The first result is the newest matching version.
   - Compare `version_number` or `date_published` with the currently installed version.

2. **By file hash** (most reliable for installed mods):
   - Compute SHA-1 or SHA-512 of the installed mod JAR file.
   - Use `POST /version_file/{hash}/update` with target loaders and game versions.
   - If a newer version exists, the response contains it; if not, 404.
   - For bulk checking: use `POST /version_files/update` with all hashes at once.

3. **Search first, then check versions**:
   - Use `GET /search?query=modname&facets=[["project_type:mod"]]` to find a project.
   - Take the `project_id` from the result.
   - Use `GET /project/{id}/version` with filters.

### Important Notes

- **No pagination on version listing**: The `/project/{id}/version` endpoint returns ALL matching versions. Use filter parameters to reduce the payload.
- **Slugs are mutable**: A project's slug can change. Always store the `id` (base62) for long-term references.
- **Version ordering**: Versions from `/project/{id}/version` are returned newest-first by `date_published`.
- **Loader name for resource packs**: Use `"minecraft"` as the loader name for resource packs, not a mod loader.
- **`featured` flag**: Project maintainers can mark specific versions as "featured." These are typically the recommended/stable versions for each game version. Filtering with `featured=true` is useful for finding the recommended version.
- **`version_type` field**: Use this to distinguish `release` from `beta` and `alpha` builds.
- **File hashes**: Both SHA-1 and SHA-512 are provided for every file. SHA-1 is the default for hash-based lookups.
- **`changelog_url` is always null**: This is a legacy field kept for backwards compatibility. Use `changelog` instead.
- **CORS enabled**: The API supports cross-origin requests with a wildcard policy, so it can be called from browser-based tools.
- **JSON array string encoding**: The `loaders`, `game_versions`, and `ids` query parameters expect their array values as **JSON-encoded strings**, not as repeated parameters. Example: `?loaders=["fabric"]` not `?loaders=fabric`.

### Common Loader Names

| Loader      | Name in API |
|-------------|-------------|
| Fabric      | `fabric`    |
| Forge       | `forge`     |
| NeoForge    | `neoforge`  |
| Quilt       | `quilt`     |
| LiteLoader  | `liteloader`|
| Rift        | `rift`      |
| Bukkit/Paper| `bukkit`    |
| Spigot      | `spigot`    |
| Sponge      | `sponge`    |
| Minecraft (resource packs) | `minecraft` |

### Dependency Types

| Type           | Meaning                                         |
|----------------|--------------------------------------------------|
| `required`     | Must be installed for the mod to function        |
| `optional`     | Enhances the mod but not required                |
| `incompatible` | Conflicts with this mod                          |
| `embedded`     | Bundled within the mod file                      |

---

## Quick Reference

| Use Case                          | Endpoint                                              | Method |
|-----------------------------------|-------------------------------------------------------|--------|
| Search mods by name               | `/search?query=...&facets=...`                        | GET    |
| Get project details               | `/project/{id\|slug}`                                 | GET    |
| Get multiple projects             | `/projects?ids=[...]`                                 | GET    |
| List versions (with filters)      | `/project/{id\|slug}/version?loaders=...&game_versions=...` | GET    |
| Get specific version              | `/project/{id\|slug}/version/{id\|number}`            | GET    |
| Get multiple versions             | `/versions?ids=[...]`                                 | GET    |
| Look up version by file hash      | `/version_file/{hash}?algorithm=sha1`                 | GET    |
| Check for update (single file)    | `/version_file/{hash}/update`                         | POST   |
| Check for updates (bulk)          | `/version_files/update`                               | POST   |
| List all Minecraft versions       | `/tag/game_version`                                   | GET    |
| List all mod loaders              | `/tag/loader`                                         | GET    |

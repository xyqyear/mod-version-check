# CurseForge API Reference

Practical documentation for the CurseForge REST API v1, focused on searching for Minecraft
mods and checking available versions/files.

**Official docs:** <https://docs.curseforge.com/rest-api/>

---

## Table of Contents

- [Base URL and Authentication](#base-url-and-authentication)
- [Minecraft Constants](#minecraft-constants)
- [Endpoints](#endpoints)
  - [Search Mods](#1-search-mods)
  - [Get Mod](#2-get-mod)
  - [Get Mods (Batch)](#3-get-mods-batch)
  - [Get Mod Files](#4-get-mod-files)
  - [Get Mod File](#5-get-mod-file)
  - [Get File Download URL](#6-get-file-download-url)
  - [Get Files (Batch)](#7-get-files-batch)
  - [Get Minecraft Versions](#8-get-minecraft-versions)
  - [Get Minecraft Mod Loaders](#9-get-minecraft-mod-loaders)
  - [Get Game Version Types](#10-get-game-version-types)
  - [Get Featured Mods](#11-get-featured-mods)
- [Enums](#enums)
- [Response Schemas](#response-schemas)
- [Pagination](#pagination)
- [Rate Limits](#rate-limits)
- [Error Handling](#error-handling)
- [Important Caveats](#important-caveats)
- [Version-Checking Strategy](#version-checking-strategy)

---

## Base URL and Authentication

| Item        | Value                              |
| ----------- | ---------------------------------- |
| **Base URL** | `https://api.curseforge.com`      |
| **Auth**    | API key via `x-api-key` header     |

API keys are obtained from the [CurseForge for Studios Console](https://console.curseforge.com/).
A developer must submit an application form reviewed by the Overwolf team. Upon approval the key
is delivered by email.

Every request must include:

```
x-api-key: YOUR_API_KEY
Accept: application/json
```

---

## Minecraft Constants

| Constant                  | Value  | Notes                                         |
| ------------------------- | ------ | --------------------------------------------- |
| **Game ID**               | `432`  | Required for all Minecraft-related queries     |
| **classId (Mods)**        | `6`    | Filters search to mods only                   |
| **classId (Modpacks)**    | `4471` | Filters search to modpacks only               |
| **classId (Resource Packs)** | `12` | Texture/resource packs                        |
| **classId (Worlds)**      | `17`   | World saves                                   |
| **classId (Shaders)**     | `6552` | Shader packs                                  |
| **classId (Data Packs)**  | `6945` | Data packs                                    |

Retrieve the full list dynamically:
`GET /v1/categories?gameId=432&classesOnly=true`

---

## Endpoints

### 1. Search Mods

Search for mods by name, game version, mod loader, category, and more.

```
GET /v1/mods/search
```

#### Query Parameters

| Parameter            | Type      | Required | Description                                                                 |
| -------------------- | --------- | -------- | --------------------------------------------------------------------------- |
| `gameId`             | int       | **yes**  | Must be `432` for Minecraft                                                 |
| `classId`            | int       | no       | Filter by class (e.g. `6` for mods)                                        |
| `categoryId`         | int       | no       | Filter by single category                                                  |
| `categoryIds`        | string    | no       | Comma-separated list of category IDs (overrides `categoryId`)              |
| `searchFilter`       | string    | no       | Free text search on mod name and author                                    |
| `slug`               | string    | no       | Filter by slug (unique when coupled with `classId`)                        |
| `gameVersion`        | string    | no       | Filter by game version (e.g. `"1.20.1"`)                                  |
| `gameVersions`       | string    | no       | Comma-separated game version strings (overrides `gameVersion`)             |
| `modLoaderType`      | int       | no       | Filter by mod loader enum value. **Must be coupled with `gameVersion`**    |
| `modLoaderTypes`     | string    | no       | Comma-separated mod loader types (overrides `modLoaderType`)               |
| `gameVersionTypeId`  | int       | no       | Filter by version type ID                                                  |
| `authorId`           | int       | no       | Filter by author membership                                               |
| `primaryAuthorId`    | int       | no       | Filter by project owner                                                    |
| `sortField`          | int       | no       | Sort field enum (see [ModsSearchSortField](#modssearchsortfield))          |
| `sortOrder`          | string    | no       | `"asc"` or `"desc"`                                                        |
| `index`              | int       | no       | Zero-based pagination offset                                               |
| `pageSize`           | int       | no       | Results per page (max `50`, default `50`)                                  |

#### Example: Search for "JEI" on Minecraft 1.20.1 with Forge

```bash
curl -s "https://api.curseforge.com/v1/mods/search?gameId=432&classId=6&searchFilter=JEI&gameVersion=1.20.1&modLoaderType=1&sortField=2&sortOrder=desc&pageSize=10" \
  -H "Accept: application/json" \
  -H "x-api-key: $CF_API_KEY"
```

#### Response (abbreviated)

```json
{
  "data": [
    {
      "id": 238222,
      "name": "Just Enough Items (JEI)",
      "slug": "jei",
      "summary": "View Items and Recipes",
      "downloadCount": 250000000,
      "latestFilesIndexes": [
        {
          "gameVersion": "1.20.1",
          "fileId": 5101366,
          "filename": "jei-1.20.1-forge-15.20.0.106.jar",
          "releaseType": 1,
          "modLoader": 1
        }
      ],
      "latestFiles": [ ... ],
      ...
    }
  ],
  "pagination": {
    "index": 0,
    "pageSize": 10,
    "resultCount": 3,
    "totalCount": 3
  }
}
```

---

### 2. Get Mod

Retrieve full details for a single mod by its CurseForge project ID.

```
GET /v1/mods/{modId}
```

#### Path Parameters

| Parameter | Type | Required | Description      |
| --------- | ---- | -------- | ---------------- |
| `modId`   | int  | **yes**  | The mod's ID     |

#### Example

```bash
curl -s "https://api.curseforge.com/v1/mods/238222" \
  -H "Accept: application/json" \
  -H "x-api-key: $CF_API_KEY"
```

#### Response

Returns a single Mod object wrapped in `{ "data": { ... } }`. The response includes
`latestFiles` (array of full File objects) and `latestFilesIndexes` (lightweight index of
the latest file per game-version/loader combo). See [Mod Object](#mod-object) for the
full schema.

---

### 3. Get Mods (Batch)

Retrieve details for multiple mods at once by their IDs.

```
POST /v1/mods
```

#### Request Body

```json
{
  "modIds": [238222, 308702, 306612],
  "filterPcOnly": true
}
```

#### Response

```json
{
  "data": [ ...array of Mod objects... ]
}
```

This is the most efficient approach when checking versions for a known list of mods.

---

### 4. Get Mod Files

List all files (versions) of a mod with optional filtering by game version and mod loader.

```
GET /v1/mods/{modId}/files
```

#### Query Parameters

| Parameter               | Type   | Required | Description                                           |
| ----------------------- | ------ | -------- | ----------------------------------------------------- |
| `gameVersion`           | string | no       | Filter by game version string (e.g. `"1.20.1"`)      |
| `modLoaderType`         | int    | no       | Filter by mod loader enum value                       |
| `gameVersionTypeId`     | int    | no       | Filter by version type ID                             |
| `releaseTypes`          | string | no       | Comma-separated FileReleaseType values (1,2,3)        |
| `olderThanProjectFileId`| int    | no       | Return only files older than this file ID             |
| `index`                 | int    | no       | Zero-based pagination offset                          |
| `pageSize`              | int    | no       | Results per page (max `50`)                           |

#### Example: Get latest Forge files for JEI on 1.20.1

```bash
curl -s "https://api.curseforge.com/v1/mods/238222/files?gameVersion=1.20.1&modLoaderType=1&pageSize=5" \
  -H "Accept: application/json" \
  -H "x-api-key: $CF_API_KEY"
```

#### Response

```json
{
  "data": [
    {
      "id": 5101366,
      "modId": 238222,
      "displayName": "jei-1.20.1-forge-15.20.0.106",
      "fileName": "jei-1.20.1-forge-15.20.0.106.jar",
      "releaseType": 1,
      "fileDate": "2024-10-15T12:00:00Z",
      "gameVersions": ["1.20.1", "Forge"],
      "sortableGameVersions": [
        {
          "gameVersionName": "1.20.1",
          "gameVersionPadded": "0000000001.0000000020.0000000001",
          "gameVersion": "1.20.1",
          "gameVersionReleaseDate": "2023-06-12T00:00:00Z",
          "gameVersionTypeId": 73242
        }
      ],
      "downloadUrl": "https://edge.forgecdn.net/files/...",
      "dependencies": [
        { "modId": 306612, "relationType": 3 }
      ],
      ...
    }
  ],
  "pagination": {
    "index": 0,
    "pageSize": 5,
    "resultCount": 5,
    "totalCount": 42
  }
}
```

---

### 5. Get Mod File

Get details for a specific file by mod ID and file ID.

```
GET /v1/mods/{modId}/files/{fileId}
```

#### Response

```json
{
  "data": { ...single File object... }
}
```

---

### 6. Get File Download URL

Get the download URL for a specific file.

```
GET /v1/mods/{modId}/files/{fileId}/download-url
```

#### Response

```json
{
  "data": "https://edge.forgecdn.net/files/..."
}
```

Returns `null` in `data` if the mod author has disabled third-party distribution.

---

### 7. Get Files (Batch)

Retrieve details for multiple files by their IDs (no mod ID required).

```
POST /v1/mods/files
```

#### Request Body

```json
{
  "fileIds": [5101366, 5098734]
}
```

---

### 8. Get Minecraft Versions

List all known Minecraft game versions.

```
GET /v1/minecraft/version
```

| Parameter        | Type    | Required | Description                       |
| ---------------- | ------- | -------- | --------------------------------- |
| `sortDescending` | boolean | no       | Sort order for versions           |

#### Example

```bash
curl -s "https://api.curseforge.com/v1/minecraft/version?sortDescending=true" \
  -H "Accept: application/json" \
  -H "x-api-key: $CF_API_KEY"
```

Get a specific version:

```
GET /v1/minecraft/version/{gameVersionString}
```

Example: `GET /v1/minecraft/version/1.20.1`

---

### 9. Get Minecraft Mod Loaders

List all known Minecraft mod loaders.

```
GET /v1/minecraft/modloader
```

| Parameter    | Type    | Required | Description                                  |
| ------------ | ------- | -------- | -------------------------------------------- |
| `version`    | string  | no       | Filter by Minecraft version (e.g. `"1.20.1"`) |
| `includeAll` | boolean | no       | Include all loaders, not just latest         |

Get a specific mod loader:

```
GET /v1/minecraft/modloader/{modLoaderName}
```

Example: `GET /v1/minecraft/modloader/forge-47.3.0`

---

### 10. Get Game Version Types

Returns all version types for a game. Useful for understanding `gameVersionTypeId` values
used in file filtering.

```
GET /v1/games/{gameId}/version-types
```

Example: `GET /v1/games/432/version-types`

---

### 11. Get Featured Mods

Returns featured and popular mods for a game.

```
POST /v1/mods/featured
```

#### Request Body

```json
{
  "gameId": 432,
  "excludedModIds": [],
  "gameVersionTypeId": null
}
```

#### Response

```json
{
  "data": {
    "featured": [ ...Mod objects... ],
    "popular": [ ...Mod objects... ],
    "recentlyUpdated": [ ...Mod objects... ],
    "earlyAccess": [ ...Mod objects... ]
  }
}
```

---

## Enums

### ModLoaderType

| Value | Name        | Notes                              |
| ----- | ----------- | ---------------------------------- |
| `0`   | Any         | No filter (matches all loaders)    |
| `1`   | Forge       | Minecraft Forge                    |
| `2`   | Cauldron    | Legacy, rarely used                |
| `3`   | LiteLoader  | Legacy, rarely used                |
| `4`   | Fabric      | Fabric Loader                      |
| `5`   | Quilt       | Quilt Loader                       |
| `6`   | NeoForge    | NeoForge (Forge successor, 1.20.1+)|

### ModsSearchSortField

| Value | Name             | Description                      |
| ----- | ---------------- | -------------------------------- |
| `1`   | Featured         | Featured status                  |
| `2`   | Popularity       | Current popularity ranking       |
| `3`   | LastUpdated      | Last updated date                |
| `4`   | Name             | Alphabetical by name             |
| `5`   | Author           | Alphabetical by author           |
| `6`   | TotalDownloads   | Total download count             |
| `7`   | Category         | By category                      |
| `8`   | GameVersion      | By game version                  |
| `9`   | EarlyAccess      | Early access status              |
| `10`  | FeaturedReleased | Featured released                |
| `11`  | ReleasedDate     | Release date                     |
| `12`  | Rating           | By rating                        |

### FileReleaseType

| Value | Name    |
| ----- | ------- |
| `1`   | Release |
| `2`   | Beta    |
| `3`   | Alpha   |

### FileRelationType (Dependency Type)

| Value | Name               |
| ----- | ------------------ |
| `1`   | EmbeddedLibrary    |
| `2`   | OptionalDependency |
| `3`   | RequiredDependency |
| `4`   | Tool               |
| `5`   | Incompatible       |
| `6`   | Include            |

### HashAlgo

| Value | Name |
| ----- | ---- |
| `1`   | Sha1 |
| `2`   | Md5  |

### FileStatus

| Value | Name                 | Notes                        |
| ----- | -------------------- | ---------------------------- |
| `1`   | Processing           |                              |
| `2`   | ChangesRequired      |                              |
| `3`   | UnderReview          |                              |
| `4`   | Approved             | Available for download       |
| `5`   | Rejected             |                              |
| `6`   | MalwareDetected      |                              |
| `7`   | Deleted              |                              |
| `8`   | Archived             |                              |
| `9`   | Testing              |                              |
| `10`  | Released             | Available for download       |
| `11`  | ReadyForReview       |                              |
| `12`  | Deprecated           |                              |
| `13`  | Baking               |                              |
| `14`  | AwaitingPublishing   |                              |
| `15`  | FailedPublishing     |                              |

### ModStatus

| Value | Name              |
| ----- | ----------------- |
| `1`   | New               |
| `2`   | ChangesRequired   |
| `3`   | UnderSoftReview   |
| `4`   | Approved          |
| `5`   | Rejected          |
| `6`   | ChangesMade       |
| `7`   | Inactive          |
| `8`   | Abandoned         |
| `9`   | Deleted           |
| `10`  | UnderReview       |

---

## Response Schemas

### Mod Object

```
{
  id:                          int       -- CurseForge project ID
  gameId:                      int       -- 432 for Minecraft
  name:                        string
  slug:                        string    -- URL-friendly name
  links: {
    websiteUrl:                string
    wikiUrl:                   string | null
    issuesUrl:                 string | null
    sourceUrl:                 string | null
  }
  summary:                     string    -- Short description
  status:                      int       -- ModStatus enum
  downloadCount:               int       -- Total downloads
  isFeatured:                  bool
  primaryCategoryId:           int
  categories:                  Category[]
  classId:                     int       -- 6 = Mods, 4471 = Modpacks, etc.
  authors:                     Author[]
  logo:                        Asset
  screenshots:                 Asset[]
  mainFileId:                  int       -- ID of the main/primary file
  latestFiles:                 File[]    -- Latest files across versions
  latestFilesIndexes:          FileIndex[] -- Lightweight latest file index
  latestEarlyAccessFilesIndexes: FileIndex[]
  dateCreated:                 string    -- ISO 8601
  dateModified:                string    -- ISO 8601
  dateReleased:                string    -- ISO 8601
  allowModDistribution:        bool | null -- See caveats section
  gamePopularityRank:          int
  isAvailable:                 bool
  thumbsUpCount:               int
  rating:                      int
}
```

### File Object

```
{
  id:                          int       -- File ID
  gameId:                      int
  modId:                       int
  isAvailable:                 bool
  displayName:                 string    -- Human-readable name
  fileName:                    string    -- Actual JAR filename
  releaseType:                 int       -- FileReleaseType enum
  fileStatus:                  int       -- FileStatus enum
  hashes:                      Hash[]    -- [{value, algo}]
  fileDate:                    string    -- ISO 8601 upload date
  fileLength:                  int       -- File size in bytes
  downloadCount:               int
  fileSizeOnDisk:              int
  downloadUrl:                 string | null  -- null if distribution blocked
  gameVersions:                string[]  -- e.g. ["1.20.1", "Forge", "Java 17"]
  sortableGameVersions:        SortableGameVersion[]
  dependencies:                Dependency[]
  exposeAsAlternative:         bool
  parentProjectFileId:         int
  alternateFileId:             int
  isServerPack:                bool
  serverPackFileId:            int | null
  isEarlyAccessContent:        bool
  earlyAccessEndDate:          string | null
  fileFingerprint:             int       -- Murmur2 hash
  modules:                     Module[]  -- [{name, fingerprint}]
}
```

### FileIndex Object

A lightweight representation used in `latestFilesIndexes` on the Mod object. This is the
fastest way to check what the latest file is for a specific game version and loader.

```
{
  gameVersion:                 string    -- e.g. "1.20.1"
  fileId:                      int       -- Reference to the full File
  filename:                    string
  releaseType:                 int       -- FileReleaseType enum
  gameVersionTypeId:           int | null
  modLoader:                   int | null -- ModLoaderType enum (nullable)
}
```

### SortableGameVersion Object

```
{
  gameVersionName:             string    -- e.g. "1.20.1"
  gameVersionPadded:           string    -- Zero-padded for sorting
  gameVersion:                 string
  gameVersionReleaseDate:      string    -- ISO 8601
  gameVersionTypeId:           int
}
```

### Pagination Object

```
{
  index:                       int       -- Zero-based offset used
  pageSize:                    int       -- Requested page size
  resultCount:                 int       -- Actual results returned
  totalCount:                  int       -- Total matching results (int64)
}
```

---

## Pagination

- Maximum `pageSize`: **50**
- Hard cap: **index + pageSize <= 10,000** (you cannot paginate beyond 10,000 results)
- The `pagination` object is present in all list responses
- To iterate all pages:
  1. Start with `index=0`
  2. Increment `index` by `pageSize` on each iteration
  3. Stop when `index >= totalCount` or `index + pageSize > 10,000`

```python
index = 0
page_size = 50
while True:
    response = get_mod_files(mod_id, index=index, pageSize=page_size)
    files = response["data"]
    pagination = response["pagination"]
    # process files...
    index += page_size
    if index >= pagination["totalCount"]:
        break
```

---

## Rate Limits

CurseForge does **not** publicly document specific rate limit numbers (requests per
second/minute). What is known from community experience:

| Aspect                 | Details                                                     |
| ---------------------- | ----------------------------------------------------------- |
| **Documented limits**  | None published                                              |
| **Error on exceed**    | HTTP **403 Forbidden** (not the standard 429)               |
| **Error message**      | "Forbidden" or message about rate-limit exceeded            |
| **Reset time**         | Not documented; community suggests approximately 1 hour     |
| **Cloudflare**         | CurseForge sits behind Cloudflare; aggressive clients may be IP-blocked |

### Recommended practices

- Use batch endpoints (`POST /v1/mods`, `POST /v1/mods/files`) to reduce request count
- Use `latestFilesIndexes` from the Mod object instead of calling Get Mod Files separately
  when you only need to know the latest version
- Implement exponential backoff with jitter on 403 responses
- Cache responses where possible (mod metadata changes infrequently)
- Add a small delay (100-200ms) between sequential requests

---

## Error Handling

| HTTP Status | Meaning                                                      |
| ----------- | ------------------------------------------------------------ |
| **200**     | Success                                                      |
| **400**     | Bad request (invalid parameters)                             |
| **403**     | Forbidden: invalid API key **or** rate limit exceeded        |
| **404**     | Resource not found (invalid mod ID, file ID, etc.)           |
| **500**     | Internal server error                                        |
| **503**     | Service unavailable (documented for fingerprint endpoints)   |

The 403 status is used for both authentication errors and rate limiting. Distinguish
between them by:

1. Verifying your API key is valid
2. Checking if you have been making many rapid requests
3. Trying again after a delay

---

## Important Caveats

### downloadUrl can be null

Some mod authors disable third-party distribution via the **Project Distribution Toggle**.
When `allowModDistribution` is `false` (or `null`) on the Mod object, the `downloadUrl`
field on File objects will be `null`. In this case, the file can only be downloaded
manually from the CurseForge website.

This is common for popular mods. Your tool should handle this gracefully (e.g., provide a
link to the CurseForge page instead).

### gameVersions array contains mixed data

The `gameVersions` array on a File object contains both Minecraft versions **and** mod
loader names as strings. For example: `["1.20.1", "Forge", "Java 17"]`. To determine the
actual Minecraft version, filter out known non-version strings or use the
`sortableGameVersions` array which provides structured data.

### modLoaderType requires gameVersion

The `modLoaderType` parameter in the Search Mods endpoint **must be coupled with
`gameVersion`**. Passing `modLoaderType` alone without `gameVersion` may not work as
expected.

### latestFilesIndexes is the fastest version check

The `latestFilesIndexes` array on the Mod object provides a pre-computed index of the
latest file for each game version and mod loader combination. This is much faster than
calling the Get Mod Files endpoint and paginating through all results. However, it only
shows the single latest file per version/loader pair.

### unsigned int32

Unless stated otherwise, all int32 responses are unsigned.

### Fingerprints

CurseForge uses a variant of **Murmur2 hashing with seed 1** for file fingerprints. The
hash is computed after stripping whitespace characters (9, 10, 13, 32) from the file. This
is useful for identifying files without relying on filenames.

---

## Version-Checking Strategy

For a mod version checking tool, the recommended approach is:

### Quick check: Use latestFilesIndexes

1. Fetch the mod via `GET /v1/mods/{modId}` (or batch via `POST /v1/mods`)
2. Read the `latestFilesIndexes` array on the Mod object
3. Filter entries by `gameVersion` and `modLoader` to find the latest file

```python
mod = get_mod(mod_id)
for index_entry in mod["data"]["latestFilesIndexes"]:
    if index_entry["gameVersion"] == "1.20.1" and index_entry["modLoader"] == 1:
        print(f"Latest file: {index_entry['filename']} (ID: {index_entry['fileId']})")
        print(f"Release type: {index_entry['releaseType']}")  # 1=Release, 2=Beta, 3=Alpha
```

### Full file listing: Use Get Mod Files

1. Call `GET /v1/mods/{modId}/files?gameVersion=1.20.1&modLoaderType=1`
2. Results are sorted by `fileDate` descending (newest first)
3. The first result with `releaseType=1` is the latest stable release

### Batch check for multiple mods

1. Call `POST /v1/mods` with all mod IDs at once (up to reasonable batch sizes)
2. For each mod in the response, check `latestFilesIndexes`
3. Compare against locally installed versions

This minimizes API calls and avoids rate limiting issues.

---

## Sources

- [CurseForge for Studios API (Official)](https://docs.curseforge.com/rest-api/)
- [CurseForge Getting Started](https://docs.curseforge.com/)
- [About the CurseForge API and How to Apply for a Key](https://support.curseforge.com/support/solutions/articles/9000208346-about-the-curseforge-api-and-how-to-apply-for-a-key)
- [Project Distribution Toggle](https://support.curseforge.com/support/solutions/articles/9000207877-project-distribution-toggle)
- [aternosorg/php-curseforge-api (OpenAPI spec)](https://github.com/aternosorg/php-curseforge-api)
- [minimusubi/curseforge-api (TypeScript client)](https://github.com/minimusubi/curseforge-api)
- [CurseForgeCommunity/.NET-APIClient](https://github.com/CurseForgeCommunity/.NET-APIClient)

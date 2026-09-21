// Bun original features of package.json. Everything else comes from the standard npm schema (SchemaStore).
// injectBunOriginalFeatures.ts merges this into the npm schema; on conflict, this file wins.
// Sources: bun-types/docs (pm/catalogs, pm/overrides, pm/workspaces, guides/install/trusted, pm/cli/patch)

export const SCHEMA_URL =
  "https://raw.githubusercontent.com/mtugb/bun-package-json-schema/main/schema.json";

export const bunOriginalFeatures = {
  $id: SCHEMA_URL,
  title: "package.json for Bun",
  definitions: {
    bunCatalog: {
      description:
        "Package name to version range. Reference an entry from a dependency with the `catalog:` protocol.",
      type: "object",
      additionalProperties: { type: "string" },
    },
    bunCatalogs: {
      description:
        'Named catalogs. Reference one from a dependency with `"catalog:<name>"`.',
      type: "object",
      additionalProperties: { $ref: "#/definitions/bunCatalog" },
    },
    bunOverrideValue: {
      description:
        'A dependency specifier (version range, `npm:` alias, `catalog:`, or `$name` to reuse a declared range). An object scopes the rule to one parent package; `"."` overrides the parent itself.',
      anyOf: [
        { type: "string" },
        {
          type: "object",
          additionalProperties: { $ref: "#/definitions/bunOverrideValue" },
        },
      ],
    },
  },
  properties: {
    trustedDependencies: {
      description:
        "Packages whose lifecycle scripts (`postinstall` etc.) Bun may run. Defining this field replaces Bun's default allowlist rather than extending it. See https://bun.com/docs/pm/lifecycle",
      type: "array",
      items: { type: "string" },
    },
    workspaces: {
      description:
        "Workspace package paths (glob patterns, including negative ones like `!**/test/**`), or an object that also holds catalogs. See https://bun.com/docs/pm/workspaces",
      anyOf: [
        {
          type: "array",
          items: { type: "string" },
        },
        {
          type: "object",
          properties: {
            packages: {
              description: "Workspace package paths. Glob patterns are supported.",
              type: "array",
              items: { type: "string" },
            },
            catalog: { $ref: "#/definitions/bunCatalog" },
            catalogs: { $ref: "#/definitions/bunCatalogs" },
          },
        },
      ],
    },
    catalog: {
      description:
        "Default catalog of shared dependency versions. Reference it with `catalog:`. Also accepted inside `workspaces`. See https://bun.com/docs/pm/catalogs",
      $ref: "#/definitions/bunCatalog",
    },
    catalogs: {
      description:
        "Named catalogs of shared dependency versions. Also accepted inside `workspaces`. See https://bun.com/docs/pm/catalogs",
      $ref: "#/definitions/bunCatalogs",
    },
    overrides: {
      description:
        "npm-style overrides for metadependencies. Bun only reads this from the root package.json. See https://bun.com/docs/pm/overrides",
      type: "object",
      additionalProperties: { $ref: "#/definitions/bunOverrideValue" },
    },
    resolutions: {
      description:
        "Yarn-style resolutions (supported for migration). Same values as `overrides`; keys may use Yarn's `parent/child` path form. See https://bun.com/docs/pm/overrides",
      type: "object",
      additionalProperties: { $ref: "#/definitions/bunOverrideValue" },
    },
    patchedDependencies: {
      description:
        'Patched packages, written by `bun patch --commit`. Maps `name@version` to the path of its `.patch` file, e.g. `"react@17.0.2": "patches/react@17.0.2.patch"`. See https://bun.com/docs/pm/cli/patch',
      type: "object",
      additionalProperties: { type: "string" },
    },
  },
};

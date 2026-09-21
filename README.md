# package.json schema for Bun
**No warranties: all generated with Claude.**
Do not trust this.
This is just for you not to do typo:)

## Installation
Just add one line in your package.json as below;
```jsonc
{
    "$schema": "https://raw.githubusercontent.com/mtugb/bun-package-json-schema/main/schema.json",
    // Your json here
}
```

## What it adds
The standard `package.json` schema (from [SchemaStore](https://www.schemastore.org/package.json)) plus Bun's own fields:
`trustedDependencies`, `workspaces` (with `catalog` / `catalogs`), `catalog`, `catalogs`, `overrides`, `resolutions`, `patchedDependencies`.

## Development
```sh
bun install
bun run inject   # npm's standard schema -> inject bunOriginalFeatures.ts -> schema.json
bun test         # check schema.json against test/valid and test/invalid
```
To cover a new Bun field: edit `bunOriginalFeatures.ts`, add a sample to `test/valid/` and one to `test/invalid/`, then `bun run inject && bun test`.

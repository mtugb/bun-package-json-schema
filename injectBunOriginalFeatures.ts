// npm's standard package.json schema -> inject Bun's original features -> schema.json
import { bunOriginalFeatures } from "./bunOriginalFeatures";

const NPM_SCHEMA_URL = "https://www.schemastore.org/package.json";
const OUT = new URL("./schema.json", import.meta.url);

type Json = { [key: string]: unknown };

const isObject = (v: unknown): v is Json =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// The npm schema refers to sibling schemas with relative refs (e.g. "eslintrc.json"), which
// only resolve against its own $id. Ours differs, so make them absolute.
function absolutizeRefs(node: unknown, base: string): void {
  if (Array.isArray(node)) return node.forEach((n) => absolutizeRefs(n, base));
  if (!isObject(node)) return;
  for (const [key, value] of Object.entries(node)) {
    if (key === "$ref" && typeof value === "string" && !value.startsWith("#") && !URL.canParse(value)) {
      node[key] = new URL(value, base).href;
    } else {
      absolutizeRefs(value, base);
    }
  }
}

// Objects merge recursively; arrays and scalars are replaced by `features` (Bun wins).
// Each path where a different existing npm value gets replaced goes to `replaced`.
function inject(npm: Json, features: Json, path: string[], replaced: string[]): Json {
  const out: Json = { ...npm };
  for (const [key, value] of Object.entries(features)) {
    const here = [...path, key];
    const existing = npm[key];
    if (isObject(existing) && isObject(value)) {
      out[key] = inject(existing, value, here, replaced);
    } else {
      if (existing !== undefined && JSON.stringify(existing) !== JSON.stringify(value)) {
        replaced.push(here.join("."));
      }
      out[key] = value;
    }
  }
  return out;
}

export function injectBunOriginalFeatures(npmSchema: Json, features: Json = bunOriginalFeatures) {
  absolutizeRefs(npmSchema, npmSchema.$id as string);
  const replaced: string[] = [];
  const schema = inject(npmSchema, features, [], replaced);
  return { schema, replaced };
}

if (import.meta.main) {
  const res = await fetch(NPM_SCHEMA_URL);
  if (!res.ok) throw new Error(`GET ${NPM_SCHEMA_URL} -> ${res.status}`);

  // The features are written against the bun-types docs; record which version they came from.
  const bunTypes = await Bun.file(new URL("./node_modules/bun-types/package.json", import.meta.url)).json();
  const features = { ...bunOriginalFeatures, $comment: `Bun original features based on bun-types ${bunTypes.version} docs` };

  const { schema, replaced } = injectBunOriginalFeatures((await res.json()) as Json, features);
  await Bun.write(OUT, JSON.stringify(schema, null, 2) + "\n");

  console.log(`wrote schema.json (${Object.keys(schema.properties as Json).length} properties)`);
  if (replaced.length > 0) {
    console.log("Bun features replaced npm schema values at:");
    for (const p of replaced) console.log(`  ${p}`);
  }
}

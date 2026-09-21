import { describe, expect, test } from "bun:test";
import Ajv from "ajv";

const schema = await Bun.file(new URL("../schema.json", import.meta.url)).json();

// Upstream uses formats and annotation keywords Ajv doesn't need for these checks.
const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: false });

// Schemas for other tools (eslintrc, prettierrc, ...) are referenced by URL. They're out of
// scope here and Ajv doesn't fetch, so stand in an empty schema for each.
function externalRefs(node: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(node)) node.forEach((n) => externalRefs(n, found));
  else if (typeof node === "object" && node !== null) {
    for (const [key, value] of Object.entries(node)) {
      if (key === "$ref" && typeof value === "string" && !value.startsWith("#")) found.add(value);
      else externalRefs(value, found);
    }
  }
  return found;
}
for (const url of externalRefs(schema)) ajv.addSchema({}, url);

async function load(dir: "valid" | "invalid") {
  const glob = new Bun.Glob("*.json");
  const cwd = new URL(`./${dir}/`, import.meta.url).pathname;
  const files = [...glob.scanSync({ cwd })].sort();
  return Promise.all(files.map(async (name) => [name, await Bun.file(`${cwd}${name}`).json()] as const));
}

test("schema.json is a valid JSON Schema", () => {
  expect(ajv.validateSchema(schema)).toBe(true);
  expect(() => ajv.compile(schema)).not.toThrow();
});

const validate = ajv.compile(schema);

describe("valid/ passes", async () => {
  for (const [name, json] of await load("valid")) {
    test(name, () => {
      validate(json);
      expect(validate.errors ?? []).toEqual([]);
    });
  }
});

describe("invalid/ is rejected", async () => {
  for (const [name, json] of await load("invalid")) {
    test(name, () => {
      expect(validate(json)).toBe(false);
    });
  }
});

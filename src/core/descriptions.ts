// Utility to resolve feature descriptions from `02 classes.json`
// It supports slugged descriptionRef paths like
//   "barbarian > rage"
//   "barbarian > path-of-the-berserker > frenzy"
//   "paladin > oath-of-devotion > channel-divinity-turn-the-unholy"
// by matching against keys inside the corresponding class section of the JSON.

import classesDoc from "./02 classes.json";

type ClassEntries = Record<string, string>;
type ClassesDoc = Record<string, ClassEntries>;

const doc = classesDoc as unknown as ClassesDoc;

function slugify(input: string): string {
  return input
    .toLowerCase()
    // replace non-alphanumeric with hyphen
    .replace(/[^a-z0-9]+/g, "-")
    // collapse multiple hyphens
    .replace(/-+/g, "-")
    // trim hyphens
    .replace(/^-|-$/g, "");
}

function findClassKeyBySlug(classSlug: string): string | undefined {
  const keys = Object.keys(doc);
  for (const key of keys) {
    if (slugify(key) === classSlug) return key;
  }
  return undefined;
}

function findEntryKeyBySlug(entries: ClassEntries, entrySlug: string): string | undefined {
  let exact: string | undefined;
  let bestPrefix: { key: string; len: number } | undefined;

  for (const key of Object.keys(entries)) {
    const s = slugify(key);
    if (s === entrySlug) {
      exact = key;
      break;
    }
    // Fallback: allow longest key slug that is a prefix of the requested slug
    // e.g. "channel-divinity" matches "channel-divinity-turn-the-unholy"
    if (entrySlug.startsWith(s)) {
      if (!bestPrefix || s.length > bestPrefix.len) {
        bestPrefix = { key, len: s.length };
      }
    }
  }

  return exact ?? bestPrefix?.key;
}

/**
 * Resolve a descriptionRef like "paladin > oath-of-devotion > channel-divinity-turn-the-unholy"
 * to the corresponding markdown/text from 02 classes.json.
 */
export function getDescription(ref: string): string | undefined {
  if (!ref) return undefined;
  // split on '>' and trim segments
  const segments = ref.split(">").map(s => s.trim()).filter(Boolean);
  if (segments.length === 0) return undefined;

  const classSlug = slugify(segments[0]);
  const classKey = findClassKeyBySlug(classSlug);
  if (!classKey) return undefined;

  const entries = doc[classKey];
  if (!entries) return undefined;

  // Prefer the last segment as the feature id (most specific)
  const featureSlug = segments.length > 1 ? slugify(segments[segments.length - 1]) : "";

  if (!featureSlug) {
    // No feature specified; return the class intro if present
    // Try a couple of common intro keys
    const introKey = ["The " + classKey, classKey].find(k => entries[k]);
    return introKey ? entries[introKey] : undefined;
  }

  const entryKey = findEntryKeyBySlug(entries, featureSlug);
  return entryKey ? entries[entryKey] : undefined;
}

/**
 * Convenience: resolve by class and feature names directly (any casing),
 * without building a full descriptionRef string.
 */
export function getDescriptionBy(className: string, featureName?: string): string | undefined {
  const classKey = findClassKeyBySlug(slugify(className));
  if (!classKey) return undefined;
  const entries = doc[classKey];
  if (!featureName) {
    const introKey = ["The " + classKey, classKey].find(k => entries[k]);
    return introKey ? entries[introKey] : undefined;
  }
  const entryKey = findEntryKeyBySlug(entries, slugify(featureName));
  return entryKey ? entries[entryKey] : undefined;
}

export type { ClassesDoc, ClassEntries };

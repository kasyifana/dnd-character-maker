// Resolve feature descriptions from features_class.json for use in PDF output
// Tolerates minor name variations (page refs, parenthetical suffixes, punctuation differences).

// Import the reference JSON. tsconfig should have resolveJsonModule enabled.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import FEATURES from './features_class.json';

type JsonValue = string | { content?: string | string[]; table?: unknown } | Record<string, any>;

function normalizeKey(s: string): string {
  return (s || '')
    .toLowerCase()
    // strip page refs or any trailing parenthetical e.g., " (p.109)", " (1 die)"
    .replace(/\s*\([^)]*\)\s*$/g, '')
    // remove punctuation and special quotes/emdashes/colons
    .replace(/[’'`"“”:\-—]/g, '')
    .replace(/\s+/g, ' ') // collapse spaces
    .trim();
}

function findKeyCI(obj: Record<string, any>, target: string): string | undefined {
  const normTarget = normalizeKey(target);
  let best: { key: string; score: number } | undefined;
  for (const key of Object.keys(obj)) {
    const k = normalizeKey(key);
    if (k === normTarget) return key;
    // simple similarity: prefer longest common prefix length
    let score = 0;
    const n = Math.min(k.length, normTarget.length);
    for (let i = 0; i < n && k[i] === normTarget[i]; i++) score++;
    if (!best || score > best.score) best = { key, score };
  }
  // Heuristic: only accept partial match if prefix at least 4 chars
  if (best && best.score >= 4) return best.key;
  return undefined;
}

function stringifyContent(val: JsonValue): string | undefined {
  if (val == null) return undefined;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const content = (val as any).content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) return content.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join('\n');
    // If there's a nested object but no explicit content, try to concatenate string leaves
    const parts: string[] = [];
    for (const [k, v] of Object.entries(val as any)) {
      if (k === 'table') continue; // skip tables for compactness
      if (k === 'content') continue;
      const sv = stringifyContent(v as JsonValue);
      if (sv) parts.push(`${k}: ${sv}`);
    }
    if (parts.length) return parts.join('\n');
  }
  return undefined;
}

function getClassNode(className: string): Record<string, any> | undefined {
  // Top-level keys are class names like "Barbarian", "Bard", etc.
  const clsKey = findKeyCI(FEATURES as Record<string, any>, className);
  if (!clsKey) return undefined;
  const root = (FEATURES as Record<string, any>)[clsKey];
  if (!root) return undefined;
  // Most content lives under "Class Features"
  const classFeatures = root['Class Features'] as Record<string, any> | undefined;
  return classFeatures ?? root;
}

function tryLookup(
  bucket: Record<string, any> | undefined,
  featureName: string
): string | undefined {
  if (!bucket) return undefined;
  // Direct match
  let k = findKeyCI(bucket, featureName);
  if (k) return stringifyContent(bucket[k] as JsonValue);
  // Paladin/Cleric style: Channel Divinity: <Feature>
  k = findKeyCI(bucket, `Channel Divinity: ${featureName}`);
  if (k) return stringifyContent(bucket[k] as JsonValue);
  return undefined;
}

export function getFeatureDescription(
  className: string,
  featureName: string,
  subclassName?: string
): string | undefined {
  const bucket = getClassNode(className);
  if (!bucket) return undefined;

  // First, attempt subclass feature if a subclass is active
  if (subclassName) {
    const subclassKey = findKeyCI(bucket, subclassName);
    const subclassNode = subclassKey ? (bucket as Record<string, any>)[subclassKey] : undefined;
    const subHit = tryLookup(subclassNode as Record<string, any>, featureName);
    if (subHit) return subHit;
  }

  // Fall back to base class features
  return tryLookup(bucket as Record<string, any>, featureName);
}

export function normalizeFeatureTitle(featureText: string): string {
  // Remove page refs and parenthetical suffixes; keep base title only
  return normalizeKey(featureText)
    .replace(/\s+/g, ' ')
    .replace(/\bpp?\.?\s*\d+$/g, '') // defensive: stray p. markers
    .trim()
    .replace(/\b\d+(st|nd|rd|th)\b/g, '') // strip ordinal hints inside names (rare)
    .trim()
    .replace(/\b\(.*?\)\b/g, '') // extra parens if any remain
    .trim();
}

const FeatureDescriptions = {
  getFeatureDescription,
  normalizeFeatureTitle,
};

export default FeatureDescriptions;

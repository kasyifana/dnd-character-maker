// Resolve race feature descriptions from features_race.json for use in PDF output
// Handles base race traits and subrace traits, parsing bolded headers like "***Darkvision.***".

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import RACES from './features_race.json';

type JsonValue = string | string[] | { content?: string | string[] } | Record<string, any>;

function normalizeKey(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*$/g, '') // trim trailing parentheticals like (p.20)
    .replace(/[’'`"“”:\-—]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findKeyCI(obj: Record<string, any>, target: string): string | undefined {
  const normTarget = normalizeKey(target);
  for (const key of Object.keys(obj || {})) {
    if (normalizeKey(key) === normTarget) return key;
  }
  // Fallback: contains
  for (const key of Object.keys(obj || {})) {
    if (normalizeKey(key).includes(normTarget) || normTarget.includes(normalizeKey(key))) return key;
  }
  return undefined;
}

function extractTraitMapFromContent(content: any): Record<string, string> {
  const map: Record<string, string> = {};
  if (!content) return map;
  const items: any[] = Array.isArray(content) ? content : [content];
  for (const item of items) {
    if (typeof item === 'string') {
      // Match ***Name.*** Description (dot not matching newline: use [\s\S]*)
      const m = /^\*\*\*(.+?)\.?\*\*\*\s*([\s\S]*)$/.exec(item);
      if (m) {
        const name = m[1].trim();
        const desc = m[2].trim();
        map[name] = desc || item.trim();
      }
    } else if (Array.isArray(item)) {
      // List of strings; try to join
      const flat = item.filter((x) => typeof x === 'string').join('\n');
      const m = /^\*\*\*(.+?)\.?\*\*\*\s*([\s\S]*)$/.exec(flat);
      if (m) {
        map[m[1].trim()] = m[2].trim();
      }
    } else if (typeof item === 'object') {
      // Ignore tables or nested structures here
      continue;
    }
  }
  return map;
}

function getRaceRoot(raceName: string): { baseKey: string; node: Record<string, any> } | undefined {
  const races = (RACES as any).Races as Record<string, any>;
  if (!races) return undefined;
  // Direct match first
  let baseKey = findKeyCI(races, raceName);
  if (baseKey) return { baseKey, node: races[baseKey] };

  // Try parenthetical base e.g., "Halfling (Lightfoot)" -> "Halfling"
  const baseParen = raceName.split('(')[0].trim();
  baseKey = findKeyCI(races, baseParen || raceName);
  if (baseKey) return { baseKey, node: races[baseKey] };

  // Scan for subrace match inside traits sections
  for (const k of Object.keys(races)) {
    const baseNode = races[k];
    const traitsKey = findKeyCI(baseNode, 'traits') || Object.keys(baseNode).find(kk => /traits/i.test(kk));
    if (!traitsKey) continue;
    const traitsSection = baseNode[traitsKey] as Record<string, any>;
    if (!traitsSection) continue;
    const subKey = findKeyCI(traitsSection, raceName);
    if (subKey) return { baseKey: k, node: baseNode };
  }

  return undefined;
}

function getSubraceName(raceText: string, baseKey: string): string | undefined {
  // If raceText equals the base, there's no subrace
  const baseNorm = normalizeKey(baseKey);
  const textNorm = normalizeKey(raceText);
  if (textNorm === baseNorm) return undefined;
  // Parenthetical e.g., Halfling (Lightfoot)
  const m = /\(([^)]+)\)/.exec(raceText);
  if (m) return m[1].trim();
  // Otherwise return the full text as subrace label (e.g., Hill Dwarf, High Elf)
  return raceText.trim();
}

function buildTraitIndex(baseNode: Record<string, any>, subraceName?: string): Record<string, string> {
  const index: Record<string, string> = {};
  if (!baseNode) return index;

  // Base traits section label typically "<Race> Traits"
  const traitsKey = findKeyCI(baseNode, 'traits') || Object.keys(baseNode).find(k => /traits/i.test(k));
  const traitsSection = traitsKey ? baseNode[traitsKey] : undefined;
  if (traitsSection) {
    const baseMap = extractTraitMapFromContent((traitsSection as any).content);
    Object.assign(index, baseMap);
  }

  // Subrace-specific traits
  if (traitsSection && subraceName) {
    const subKey = findKeyCI(traitsSection as Record<string, any>, subraceName);
    const subNode = subKey ? (traitsSection as Record<string, any>)[subKey] : undefined;
    if (subNode) {
      const subMap = extractTraitMapFromContent((subNode as any).content);
      Object.assign(index, subMap);
    }
  }

  return index;
}

export function getRaceFeatureDescription(raceText: string, featureName: string): string | undefined {
  const base = getRaceRoot(raceText);
  if (!base) return undefined;
  // Determine subrace context using the discovered base
  const subrace = getSubraceName(raceText, base.baseKey || raceText);
  const traitIndex = buildTraitIndex(base.node as Record<string, any>, subrace);

  const normTarget = normalizeKey(featureName.replace(/\.$/, ''));
  let bestKey: string | undefined;
  for (const k of Object.keys(traitIndex)) {
    if (normalizeKey(k.replace(/\.$/, '')) === normTarget) { bestKey = k; break; }
  }
  if (!bestKey) {
    // Try contains
    for (const k of Object.keys(traitIndex)) {
      if (normalizeKey(k).includes(normTarget) || normTarget.includes(normalizeKey(k))) { bestKey = k; break; }
    }
  }
  return bestKey ? traitIndex[bestKey] : undefined;
}

const RaceFeatureDescriptions = { getRaceFeatureDescription };
export default RaceFeatureDescriptions;

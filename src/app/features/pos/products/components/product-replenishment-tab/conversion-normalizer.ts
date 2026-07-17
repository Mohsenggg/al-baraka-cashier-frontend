/** Scale factor for fixed-point arithmetic — avoids floating-point drift in GCD/LCM. */
const SCALE = 1_000_000;

export interface ConversionRuleInput {
  targetProductQuantity: number;
  sourceProductId: number;
  sourceProductName: string;
  sourceProductQuantity: number;
}

export interface NormalizedConversion {
  targetProductQuantity: number;
  sources: {
    sourceProductId: number;
    sourceProductName: string;
    sourceProductQuantity: number;
  }[];
}

function toScaledInt(value: number): number {
  return Math.round(value * SCALE);
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x || 1;
}

function gcdArray(values: number[]): number {
  return values.reduce((acc, value) => gcd(acc, value), values[0] ?? 1);
}

function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

function lcmArray(values: number[]): number {
  return values.reduce((acc, value) => lcm(acc, value), values[0] ?? 1);
}

/** Converts scaled integers back to real quantities after GCD/LCM reduction. */
function toRealQuantity(scaledValue: number, divisor: number): number {
  return scaledValue / divisor;
}

/**
 * Normalizes conversion rules to a common target quantity in simplest form.
 * Each input rule means: sourceProductQuantity of source = targetProductQuantity of target.
 */
export function normalizeConversionRules(rules: ConversionRuleInput[]): ConversionRuleInput[] {
  if (rules.length === 0) return [];

  const validRules = rules.filter(
    r => r.targetProductQuantity > 0 && r.sourceProductQuantity > 0
  );
  if (validRules.length === 0) return [];

  if (validRules.length === 1) {
    return [normalizeSingleRule(validRules[0])];
  }

  const scaledRules = validRules.map(rule => ({
    ...rule,
    sourceScaled: toScaledInt(rule.sourceProductQuantity),
    targetScaled: toScaledInt(rule.targetProductQuantity)
  }));

  const commonTargetScaled = lcmArray(scaledRules.map(r => r.targetScaled));

  const scaledSources = scaledRules.map(
    r => r.sourceScaled * (commonTargetScaled / r.targetScaled)
  );

  const divisor = gcdArray([commonTargetScaled, ...scaledSources]);

  const normalizedTarget = toRealQuantity(commonTargetScaled, divisor);

  return scaledRules.map((rule, index) => ({
    sourceProductId: rule.sourceProductId,
    sourceProductName: rule.sourceProductName,
    targetProductQuantity: normalizedTarget,
    sourceProductQuantity: toRealQuantity(scaledSources[index], divisor)
  }));
}

function normalizeSingleRule(rule: ConversionRuleInput): ConversionRuleInput {
  const sourceScaled = toScaledInt(rule.sourceProductQuantity);
  const targetScaled = toScaledInt(rule.targetProductQuantity);
  const divisor = gcd(sourceScaled, targetScaled);

  return {
    ...rule,
    sourceProductQuantity: toRealQuantity(sourceScaled, divisor),
    targetProductQuantity: toRealQuantity(targetScaled, divisor)
  };
}

/** Computes per-target source ratio for scaling when the display target quantity changes. */
export function sourcePerTargetUnit(rule: ConversionRuleInput): number {
  return rule.sourceProductQuantity / rule.targetProductQuantity;
}

/** Rebuilds rules after the user edits the shared display target quantity. */
export function scaleRulesToTargetQuantity(
  rules: ConversionRuleInput[],
  newTargetQuantity: number
): ConversionRuleInput[] {
  if (rules.length === 0 || newTargetQuantity <= 0) return rules;

  const scaled = rules.map(rule => ({
    ...rule,
    targetProductQuantity: newTargetQuantity,
    sourceProductQuantity: sourcePerTargetUnit(rule) * newTargetQuantity
  }));

  return normalizeConversionRules(scaled);
}

/** Rebuilds one rule after the user edits its normalized source quantity. */
export function updateRuleSourceQuantity(
  rules: ConversionRuleInput[],
  index: number,
  newSourceQuantity: number
): ConversionRuleInput[] {
  if (index < 0 || index >= rules.length || newSourceQuantity <= 0) return rules;

  const targetQuantity = rules[0]?.targetProductQuantity ?? 1;
  const updated = rules.map((rule, i) =>
    i === index
      ? { ...rule, sourceProductQuantity: newSourceQuantity, targetProductQuantity: targetQuantity }
      : rule
  );

  return normalizeConversionRules(updated);
}

export function toNormalizedView(rules: ConversionRuleInput[]): NormalizedConversion {
  const normalized = normalizeConversionRules(rules);
  if (normalized.length === 0) {
    return { targetProductQuantity: 1, sources: [] };
  }

  return {
    targetProductQuantity: normalized[0].targetProductQuantity,
    sources: normalized.map(r => ({
      sourceProductId: r.sourceProductId,
      sourceProductName: r.sourceProductName,
      sourceProductQuantity: r.sourceProductQuantity
    }))
  };
}

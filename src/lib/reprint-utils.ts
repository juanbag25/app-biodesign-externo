import type { ReprintAligner } from "@/lib/types";

/**
 * Formats an aligner array into a readable Spanish string.
 * Example: [{arch:"upper",number:3},{arch:"upper",number:1},{arch:"lower",number:2}]
 *   → "Superiores: 1, 3 — Inferiores: 2"
 */
export function formatAligners(aligners: ReprintAligner[]): string {
  const upper = aligners
    .filter((a) => a.arch === "upper")
    .map((a) => a.number)
    .sort((a, b) => a - b);
  const lower = aligners
    .filter((a) => a.arch === "lower")
    .map((a) => a.number)
    .sort((a, b) => a - b);

  const parts: string[] = [];
  if (upper.length > 0) parts.push(`Superiores: ${upper.join(", ")}`);
  if (lower.length > 0) parts.push(`Inferiores: ${lower.join(", ")}`);
  return parts.join(" — ");
}

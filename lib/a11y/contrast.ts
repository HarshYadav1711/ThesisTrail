import { readFileSync } from "node:fs";
import path from "node:path";

/** CSS custom properties that carry the ten locked DESIGN.md colors. */
export const LOCKED_TOKEN_VARS = {
  background: "--tt-bg",
  accent: "--tt-accent",
  positive: "--tt-positive",
  negative: "--tt-negative",
  warning: "--tt-warning",
  textPrimary: "--tt-text",
  textSecondary: "--tt-text-secondary",
  surface: "--tt-surface",
  surfaceRaised: "--tt-surface-raised",
  border: "--tt-border",
} as const;

export type DesignTokenName = keyof typeof LOCKED_TOKEN_VARS;

export type DesignTokens = Record<DesignTokenName, string>;

/** Expected values from docs/DESIGN.md (uppercase for stable comparison). */
export const DESIGN_MD_TOKENS: DesignTokens = {
  background: "#1C1C28",
  accent: "#1EC1CB",
  positive: "#4ADE80",
  negative: "#FB7185",
  warning: "#FBBF24",
  textPrimary: "#F4F4F5",
  textSecondary: "#A1A1AA",
  surface: "#242433",
  surfaceRaised: "#2A2A3B",
  border: "#3A3A4A",
};

export function normalizeHex(hex: string): string {
  const cleaned = hex.trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return cleaned.toUpperCase();
}

/** Parse the ten locked color declarations from styles/tokens.css text. */
export function parseLockedTokensFromCss(cssText: string): DesignTokens {
  const rootMatch = cssText.match(/:root\s*\{([\s\S]*?)\}/);
  if (!rootMatch) {
    throw new Error("styles/tokens.css must declare a :root block");
  }
  const rootBody = rootMatch[1];
  const declarations = new Map<string, string>();
  for (const match of rootBody.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})\s*;/g)) {
    declarations.set(match[1], normalizeHex(match[2]));
  }

  const tokens = {} as DesignTokens;
  for (const [name, cssVar] of Object.entries(LOCKED_TOKEN_VARS) as [
    DesignTokenName,
    string,
  ][]) {
    const value = declarations.get(cssVar);
    if (!value) {
      throw new Error(`Missing authoritative token declaration: ${cssVar}`);
    }
    tokens[name] = value;
  }
  return tokens;
}

export function readAuthoritativeTokens(
  tokensPath = path.join(process.cwd(), "styles", "tokens.css"),
): DesignTokens {
  const cssText = readFileSync(tokensPath, "utf8");
  return parseLockedTokensFromCss(cssText);
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex).slice(1);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function channelToLinear(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance per WCAG 2.x. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

/** Contrast ratio of two colors (unordered). */
export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastPair = {
  name: string;
  foreground: string;
  background: string;
  /** WCAG AA normal text = 4.5; large/UI chrome may use 3.0 */
  minimum: number;
};

export function shellContrastPairs(tokens: DesignTokens): ContrastPair[] {
  return [
    {
      name: "primary text on background",
      foreground: tokens.textPrimary,
      background: tokens.background,
      minimum: 4.5,
    },
    {
      name: "secondary text on background",
      foreground: tokens.textSecondary,
      background: tokens.background,
      minimum: 4.5,
    },
    {
      name: "primary text on surface",
      foreground: tokens.textPrimary,
      background: tokens.surface,
      minimum: 4.5,
    },
    {
      name: "secondary text on surface",
      foreground: tokens.textSecondary,
      background: tokens.surface,
      minimum: 4.5,
    },
    {
      name: "primary text on raised surface",
      foreground: tokens.textPrimary,
      background: tokens.surfaceRaised,
      minimum: 4.5,
    },
    {
      name: "accent on background (interactive chrome)",
      foreground: tokens.accent,
      background: tokens.background,
      minimum: 3.0,
    },
    {
      name: "warning on background (assumption badge text)",
      foreground: tokens.warning,
      background: tokens.background,
      minimum: 3.0,
    },
  ];
}

export function assertShellContrast(tokens: DesignTokens = readAuthoritativeTokens()): {
  name: string;
  ratio: number;
  minimum: number;
  pass: boolean;
}[] {
  return shellContrastPairs(tokens).map((pair) => {
    const ratio = contrastRatio(pair.foreground, pair.background);
    return {
      name: pair.name,
      ratio,
      minimum: pair.minimum,
      pass: ratio >= pair.minimum,
    };
  });
}

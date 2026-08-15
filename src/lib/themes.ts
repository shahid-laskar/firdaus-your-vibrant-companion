/**
 * Central theme registry.
 *
 * Tokens live in src/styles/themes.css — this file only names the themes
 * and carries preview swatches for the picker. Adding a theme = one CSS
 * block + one entry here. Components never reference a theme by name.
 */

export type ThemeId =
  | "veedu"
  | "noir"
  | "editorial"
  | "meridian"
  | "obsidian"
  | "helix"
  | "lumen"
  | "contrast"
  | "command"
  | "terracotta"
  | "vermillion"
  | "archive"
  | "blanc";

export type ColorMode = "light" | "dark";

export type ThemeSwatch = {
  bg: string;
  fg: string;
  primary: string;
  accent: string;
  border: string;
};

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  description: string;
  swatch: ThemeSwatch;
  swatchDark: ThemeSwatch;
};

export const DEFAULT_THEME: ThemeId = "veedu";

export const themes: ThemeDefinition[] = [
  {
    id: "veedu",
    name: "Veedu Paper",
    description:
      "Warm handcrafted paper-and-ink ground with a quiet leaf-green accent (existing default).",
    swatch: {
      bg: "oklch(0.973 0.011 84)",
      fg: "oklch(0.255 0.021 60)",
      primary: "oklch(0.255 0.021 60)",
      accent: "oklch(0.5 0.072 148)",
      border: "oklch(0.885 0.014 80)",
    },
    swatchDark: {
      bg: "oklch(0.185 0.011 65)",
      fg: "oklch(0.94 0.012 85)",
      primary: "oklch(0.94 0.012 85)",
      accent: "oklch(0.72 0.088 148)",
      border: "oklch(0.315 0.012 70)",
    },
  },
  {
    id: "noir",
    name: "Atelier Noir",
    description: "Luxury couture: near-black ground, ivory type, restrained antique-gold accent.",
    swatch: {
      bg: "oklch(0.965 0.004 85)",
      fg: "oklch(0.19 0.006 60)",
      primary: "oklch(0.19 0.006 60)",
      accent: "oklch(0.62 0.086 78)",
      border: "oklch(0.885 0.005 80)",
    },
    swatchDark: {
      bg: "oklch(0.145 0.004 70)",
      fg: "oklch(0.955 0.006 85)",
      primary: "oklch(0.955 0.006 85)",
      accent: "oklch(0.78 0.088 82)",
      border: "oklch(0.285 0.006 75)",
    },
  },
  {
    id: "editorial",
    name: "Editorial Minimal",
    description:
      "Magazine whitespace: pure paper, black serif headlines, one ink-red accent, hairline rules.",
    swatch: {
      bg: "oklch(0.995 0 0)",
      fg: "oklch(0.145 0 0)",
      primary: "oklch(0.145 0 0)",
      accent: "oklch(0.52 0.2 27)",
      border: "oklch(0.9 0 0)",
    },
    swatchDark: {
      bg: "oklch(0.145 0 0)",
      fg: "oklch(0.975 0 0)",
      primary: "oklch(0.975 0 0)",
      accent: "oklch(0.68 0.2 27)",
      border: "oklch(0.3 0 0)",
    },
  },
  {
    id: "meridian",
    name: "Meridian Enterprise",
    description:
      "Cool neutral greys with a confident corporate blue; calm, dense, dashboard-ready.",
    swatch: {
      bg: "oklch(0.982 0.003 250)",
      fg: "oklch(0.22 0.02 258)",
      primary: "oklch(0.52 0.14 254)",
      accent: "oklch(0.52 0.14 254)",
      border: "oklch(0.9 0.008 252)",
    },
    swatchDark: {
      bg: "oklch(0.17 0.015 258)",
      fg: "oklch(0.96 0.005 250)",
      primary: "oklch(0.66 0.14 254)",
      accent: "oklch(0.66 0.14 254)",
      border: "oklch(0.3 0.015 256)",
    },
  },
  {
    id: "obsidian",
    name: "Obsidian",
    description:
      "Dark-first graphite with a cool platinum accent; the light mode is a muted mirror.",
    swatch: {
      bg: "oklch(0.95 0.004 260)",
      fg: "oklch(0.2 0.012 262)",
      primary: "oklch(0.28 0.02 262)",
      accent: "oklch(0.55 0.07 218)",
      border: "oklch(0.88 0.006 260)",
    },
    swatchDark: {
      bg: "oklch(0.135 0.008 264)",
      fg: "oklch(0.965 0.004 260)",
      primary: "oklch(0.88 0.01 250)",
      accent: "oklch(0.78 0.07 214)",
      border: "oklch(0.27 0.01 262)",
    },
  },
  {
    id: "helix",
    name: "Helix",
    description: "Futuristic deep space-blue ground, electric cyan signal, tight geometric shapes.",
    swatch: {
      bg: "oklch(0.97 0.008 230)",
      fg: "oklch(0.2 0.03 250)",
      primary: "oklch(0.5 0.13 248)",
      accent: "oklch(0.62 0.13 205)",
      border: "oklch(0.88 0.014 232)",
    },
    swatchDark: {
      bg: "oklch(0.15 0.025 258)",
      fg: "oklch(0.95 0.012 230)",
      primary: "oklch(0.75 0.13 205)",
      accent: "oklch(0.82 0.14 195)",
      border: "oklch(0.3 0.03 250)",
    },
  },
  {
    id: "lumen",
    name: "Lumen",
    description:
      "Soft elegant blush neutrals, generous radii, muted mauve accent, feather shadows.",
    swatch: {
      bg: "oklch(0.98 0.008 40)",
      fg: "oklch(0.28 0.02 20)",
      primary: "oklch(0.52 0.07 340)",
      accent: "oklch(0.68 0.06 20)",
      border: "oklch(0.915 0.012 30)",
    },
    swatchDark: {
      bg: "oklch(0.19 0.012 20)",
      fg: "oklch(0.955 0.008 40)",
      primary: "oklch(0.78 0.07 340)",
      accent: "oklch(0.8 0.06 24)",
      border: "oklch(0.32 0.014 24)",
    },
  },
  {
    id: "contrast",
    name: "High Contrast",
    description:
      "Pure black-on-white, thick borders, no shadows, vivid focus ring for maximum legibility.",
    swatch: {
      bg: "oklch(1 0 0)",
      fg: "oklch(0 0 0)",
      primary: "oklch(0 0 0)",
      accent: "oklch(0.45 0.24 264)",
      border: "oklch(0.18 0 0)",
    },
    swatchDark: {
      bg: "oklch(0 0 0)",
      fg: "oklch(1 0 0)",
      primary: "oklch(1 0 0)",
      accent: "oklch(0.82 0.19 100)",
      border: "oklch(0.86 0 0)",
    },
  },
  {
    id: "command",
    name: "Command Center",
    description:
      "Cockpit slate with phosphor-green data and amber alerts; dense, monospaced, operational.",
    swatch: {
      bg: "oklch(0.955 0.004 200)",
      fg: "oklch(0.21 0.015 220)",
      primary: "oklch(0.34 0.03 220)",
      accent: "oklch(0.58 0.13 155)",
      border: "oklch(0.87 0.008 205)",
    },
    swatchDark: {
      bg: "oklch(0.145 0.012 226)",
      fg: "oklch(0.94 0.008 200)",
      primary: "oklch(0.82 0.15 150)",
      accent: "oklch(0.82 0.15 150)",
      border: "oklch(0.29 0.015 222)",
    },
  },
  {
    id: "terracotta",
    name: "Terracotta",
    description:
      "Warm contemporary sun-baked clay and oat neutrals; friendly, tactile, midcentury.",
    swatch: {
      bg: "oklch(0.968 0.014 70)",
      fg: "oklch(0.26 0.024 45)",
      primary: "oklch(0.55 0.12 42)",
      accent: "oklch(0.6 0.1 150)",
      border: "oklch(0.885 0.018 66)",
    },
    swatchDark: {
      bg: "oklch(0.185 0.014 45)",
      fg: "oklch(0.95 0.012 70)",
      primary: "oklch(0.74 0.12 45)",
      accent: "oklch(0.76 0.1 150)",
      border: "oklch(0.315 0.016 50)",
    },
  },
  {
    id: "vermillion",
    name: "Vermillion",
    description: "Bold modern flat vermillion on stark neutrals; poster-like blocks, zero gloss.",
    swatch: {
      bg: "oklch(0.975 0.002 90)",
      fg: "oklch(0.16 0.01 40)",
      primary: "oklch(0.58 0.22 28)",
      accent: "oklch(0.28 0.06 264)",
      border: "oklch(0.88 0.006 80)",
    },
    swatchDark: {
      bg: "oklch(0.155 0.008 40)",
      fg: "oklch(0.965 0.004 90)",
      primary: "oklch(0.68 0.22 30)",
      accent: "oklch(0.78 0.12 258)",
      border: "oklch(0.3 0.012 50)",
    },
  },
  {
    id: "archive",
    name: "Archive",
    description:
      "Timeless professional navy and parchment with serif authority; conservative and durable.",
    swatch: {
      bg: "oklch(0.968 0.006 95)",
      fg: "oklch(0.23 0.03 255)",
      primary: "oklch(0.33 0.08 258)",
      accent: "oklch(0.48 0.08 200)",
      border: "oklch(0.885 0.01 90)",
    },
    swatchDark: {
      bg: "oklch(0.175 0.018 258)",
      fg: "oklch(0.955 0.008 95)",
      primary: "oklch(0.8 0.08 250)",
      accent: "oklch(0.72 0.08 200)",
      border: "oklch(0.305 0.02 256)",
    },
  },
  {
    id: "blanc",
    name: "Blanc",
    description:
      "Ultra-minimal greyscale: near-invisible borders, no colour, type and spacing carry the UI.",
    swatch: {
      bg: "oklch(0.985 0 0)",
      fg: "oklch(0.24 0 0)",
      primary: "oklch(0.3 0 0)",
      accent: "oklch(0.45 0 0)",
      border: "oklch(0.93 0 0)",
    },
    swatchDark: {
      bg: "oklch(0.16 0 0)",
      fg: "oklch(0.95 0 0)",
      primary: "oklch(0.88 0 0)",
      accent: "oklch(0.78 0 0)",
      border: "oklch(0.28 0 0)",
    },
  },
];

export const themeIds = themes.map((t) => t.id);

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && themeIds.includes(value as ThemeId);
}

export function getTheme(id: ThemeId): ThemeDefinition {
  return themes.find((t) => t.id === id) ?? themes[0]!;
}

export const colors = {
  ink900: "#1a1b2e",
  ink700: "#383a52",
  ink500: "#6d6f88",
  bgBase: "#f7f2ea",
  bgElevated: "#ffffff",
  accentPrimary: "#1e3a8a",
  accentPrimaryHover: "#162a66",
  accentGold: "#8b5a3c",
  success: "#1a7a3a",
  warning: "#a06a3c",
  danger: "#b3261e",
} as const;

export const radii = { sm: 4, md: 12, lg: 24 } as const;

export const typography = {
  display: '"Playfair Display", Georgia, serif',
  body: "Inter, system-ui, -apple-system, sans-serif",
} as const;

export const durations = { fast: 120, base: 180, slow: 320 } as const;

export type Colors = typeof colors;

export const colors = {
  ink900: "#1f1414",
  ink700: "#3d2929",
  ink500: "#6b5252",
  bgBase: "#faf7f2",
  bgElevated: "#ffffff",
  accentPrimary: "#8e2a2a",
  accentPrimaryHover: "#761f1f",
  accentGold: "#b8893e",
  success: "#1a7a3a",
  warning: "#b8722c",
  danger: "#b3261e",
} as const;

export const radii = { sm: 4, md: 12, lg: 24 } as const;

export const typography = {
  display: '"Cormorant Garamond", Georgia, serif',
  body: "Inter, system-ui, -apple-system, sans-serif",
} as const;

export const durations = { fast: 120, base: 180, slow: 320 } as const;

export type Colors = typeof colors;

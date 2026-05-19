export const colors = {
  ink900: "#1a2820",
  ink700: "#3a4d44",
  ink500: "#6e8079",
  bgBase: "#d8e5cf",
  bgElevated: "#e6efde",
  accentPrimary: "#2a6b56",
  accentPrimaryHover: "#1e5443",
  accentGold: "#b8a064",
  success: "#1a7a3a",
  warning: "#a06a3c",
  danger: "#b3261e",
} as const;

export const radii = { sm: 4, md: 12, lg: 24 } as const;

export const typography = {
  display: '"Cormorant Garamond", Georgia, serif',
  body: "Manrope, system-ui, -apple-system, sans-serif",
} as const;

export const durations = { fast: 120, base: 180, slow: 320 } as const;

export type Colors = typeof colors;

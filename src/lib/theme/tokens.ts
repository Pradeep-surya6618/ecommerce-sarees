export const colors = {
  ink900: "#251f3e",
  ink700: "#443c5a",
  ink500: "#7a6e8a",
  bgBase: "#e3dce8",
  bgElevated: "#ece7ef",
  accentPrimary: "#5b3a8a",
  accentPrimaryHover: "#432966",
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

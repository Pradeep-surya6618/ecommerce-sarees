import { createTheme } from "@mui/material/styles";
import { colors, radii, typography } from "./tokens";

export const muiTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: colors.accentPrimary, dark: colors.accentPrimaryHover, contrastText: "#fff" },
    secondary: { main: colors.accentGold, contrastText: "#fff" },
    text: { primary: colors.ink900, secondary: colors.ink700, disabled: colors.ink500 },
    background: { default: colors.bgBase, paper: colors.bgElevated },
    success: { main: colors.success },
    warning: { main: colors.warning },
    error: { main: colors.danger },
  },
  shape: { borderRadius: radii.sm },
  typography: {
    fontFamily: typography.body,
    h1: { fontFamily: typography.display },
    h2: { fontFamily: typography.display },
    h3: { fontFamily: typography.display },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: radii.sm } },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: radii.md } },
    },
  },
});

import { describe, expect, it } from "vitest";
import { muiTheme } from "./mui";
import { colors, radii } from "./tokens";

describe("muiTheme", () => {
  it("maps brand colors onto the MUI palette", () => {
    expect(muiTheme.palette.primary.main).toBe(colors.accentPrimary);
    expect(muiTheme.palette.text.primary).toBe(colors.ink900);
    expect(muiTheme.palette.background.default).toBe(colors.bgBase);
  });

  it("uses the brand radius and body font", () => {
    expect(muiTheme.shape.borderRadius).toBe(radii.sm);
    expect(muiTheme.typography.fontFamily).toContain("Manrope");
  });
});

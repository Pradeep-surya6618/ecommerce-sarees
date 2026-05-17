import { describe, expect, it } from "vitest";
import { parseShopFilters, serializeShopFilters, type ShopFilters } from "./shop-filters";

describe("parseShopFilters", () => {
  it("returns empty filters from empty params", () => {
    const f = parseShopFilters({});
    expect(f).toEqual({
      fabrics: [],
      colors: [],
      occasions: [],
      sort: "newest",
      page: 1,
    });
  });

  it("parses comma-separated multi-values", () => {
    const f = parseShopFilters({ fabric: "silk,linen", color: "Maroon,Sage" });
    expect(f.fabrics).toEqual(["silk", "linen"]);
    expect(f.colors).toEqual(["Maroon", "Sage"]);
  });

  it("parses min/max price as integers", () => {
    const f = parseShopFilters({ minPrice: "100000", maxPrice: "5000000" });
    expect(f.priceMinPaise).toBe(100000);
    expect(f.priceMaxPaise).toBe(5000000);
  });

  it("parses page as a positive integer, defaulting to 1", () => {
    expect(parseShopFilters({ page: "3" }).page).toBe(3);
    expect(parseShopFilters({ page: "0" }).page).toBe(1);
    expect(parseShopFilters({ page: "-2" }).page).toBe(1);
    expect(parseShopFilters({ page: "abc" }).page).toBe(1);
  });

  it("clamps sort to the allowed set", () => {
    expect(parseShopFilters({ sort: "price-asc" }).sort).toBe("price-asc");
    expect(parseShopFilters({ sort: "bogus" }).sort).toBe("newest");
  });

  it("treats inStock=1 as true", () => {
    expect(parseShopFilters({ inStock: "1" }).inStockOnly).toBe(true);
    expect(parseShopFilters({ inStock: "0" }).inStockOnly).toBeUndefined();
  });
});

describe("serializeShopFilters", () => {
  it("omits defaults", () => {
    const url = serializeShopFilters({
      fabrics: [],
      colors: [],
      occasions: [],
      sort: "newest",
      page: 1,
    });
    expect(url).toBe("");
  });

  it("serializes multi-values and non-defaults", () => {
    const url = serializeShopFilters({
      fabrics: ["silk", "linen"],
      colors: ["Maroon"],
      occasions: [],
      priceMinPaise: 100000,
      priceMaxPaise: 5000000,
      sort: "price-asc",
      page: 2,
      inStockOnly: true,
    });
    const params = new URLSearchParams(url);
    expect(params.get("fabric")).toBe("silk,linen");
    expect(params.get("color")).toBe("Maroon");
    expect(params.get("minPrice")).toBe("100000");
    expect(params.get("maxPrice")).toBe("5000000");
    expect(params.get("sort")).toBe("price-asc");
    expect(params.get("page")).toBe("2");
    expect(params.get("inStock")).toBe("1");
  });
});

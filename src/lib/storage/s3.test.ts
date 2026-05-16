import { describe, expect, it, vi } from "vitest";

// @vitest-environment node

vi.mock("@/lib/env", () => ({
  env: {
    AWS_REGION: "ap-south-1",
    AWS_ACCESS_KEY_ID: "AKIA000000000000",
    AWS_SECRET_ACCESS_KEY: "secret-secret-secret-secret-secret",
    S3_BUCKET: "saree-ecom-dev",
    S3_PUBLIC_PREFIX: "public/",
    CDN_BASE_URL: "https://cdn.example.com",
  },
}));

describe("s3", () => {
  it("returns the same S3Client across calls", async () => {
    const { getS3 } = await import("./s3");
    expect(getS3()).toBe(getS3());
  });

  it("converts S3 keys to CDN URLs", async () => {
    const { cdnUrl } = await import("./s3");
    expect(cdnUrl("public/products/abc.jpg")).toBe(
      "https://cdn.example.com/public/products/abc.jpg",
    );
    expect(cdnUrl("/public/x.jpg")).toBe("https://cdn.example.com/public/x.jpg");
  });
});
